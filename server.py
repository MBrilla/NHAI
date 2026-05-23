import os
import io
import base64
import json
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import tensorflow as tf
import cv2

app = Flask(__name__)

# Load the model
MODEL_PATH = os.path.join("assets", "models", "newmodel.tflite")
print(f"Loading TFLite model from {MODEL_PATH}")

try:
    interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    interpreter = None

def compute_skin_ratio(img_bgr):
    """Compute the fraction of pixels in the skin-tone HSV range.
    Used to detect whether an image is already a tight nail/finger crop."""
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    # OpenCV HSV: H in [0,180], S in [0,255], V in [0,255]
    lower_skin1 = np.array([0, 15, 60])
    upper_skin1 = np.array([25, 255, 255])
    lower_skin2 = np.array([155, 15, 60])
    upper_skin2 = np.array([180, 255, 255])
    mask1 = cv2.inRange(hsv, lower_skin1, upper_skin1)
    mask2 = cv2.inRange(hsv, lower_skin2, upper_skin2)
    skin_mask = cv2.bitwise_or(mask1, mask2)
    total = skin_mask.shape[0] * skin_mask.shape[1]
    if total == 0:
        return 0.0
    return float(np.count_nonzero(skin_mask)) / total

def preprocess_image(image: Image.Image, input_details):
    # Convert PIL Image to BGR OpenCV image
    open_cv_image = np.array(image.convert('RGB')) 
    img = cv2.cvtColor(open_cv_image, cv2.COLOR_RGB2BGR)
    
    h, w, c = img.shape

    # Smart detection: skip Otsu cropping for pre-cropped images.
    # Images that are already small (<=800px) and predominantly skin/nail (>30%)
    # are already tight nail crops. Running Otsu on them is destructive.
    max_dim = max(h, w)
    skin_ratio = compute_skin_ratio(img)
    is_already_cropped = max_dim <= 800 and skin_ratio > 0.30

    if is_already_cropped:
        # Just center-square crop to normalize aspect ratio
        min_dim = min(h, w)
        y_off = (h - min_dim) // 2
        x_off = (w - min_dim) // 2
        img = img[y_off:y_off + min_dim, x_off:x_off + min_dim]
    else:
        # Camera capture path: center crop first, then skin detection + Otsu.
        # 1. Center-crop to guide area (35% × 55%) — eliminates background noise
        # 2. Skin detection on the center crop — finger is now 30-50% of the image
        # 3. Otsu on the finger region — isolates the bright nail bed
        # 4. Fine Otsu refinement — tightens to just the nail plate

        # Step 1: Center crop to match guide area with margin
        try:
            crop_w_ratio = 0.35
            crop_h_ratio = 0.55
            cc_w = int(w * crop_w_ratio)
            cc_h = int(h * crop_h_ratio)
            x_off = (w - cc_w) // 2
            y_off = (h - cc_h) // 2
            img = img[y_off:y_off + cc_h, x_off:x_off + cc_w]
        except Exception:
            pass

        # Step 2+3: Skin detection + Otsu on the center crop
        try:
            ch2, cw2 = img.shape[:2]
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            lower_skin1 = np.array([0, 15, 60])
            upper_skin1 = np.array([25, 255, 255])
            lower_skin2 = np.array([155, 15, 60])
            upper_skin2 = np.array([180, 255, 255])

            mask1 = cv2.inRange(hsv, lower_skin1, upper_skin1)
            mask2 = cv2.inRange(hsv, lower_skin2, upper_skin2)
            skin_mask = cv2.bitwise_or(mask1, mask2)

            contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                c_max = max(contours, key=cv2.contourArea)
                if cv2.contourArea(c_max) >= (ch2 * cw2 * 0.015):
                    xf, yf, wf, hf = cv2.boundingRect(c_max)

                    # Search the upper 65% of the finger for the nail plate
                    upper_hf = int(hf * 0.65)
                    finger_upper_roi = img[yf:yf+upper_hf, xf:xf+wf]

                    nail_found = False
                    if finger_upper_roi.size > 0:
                        gray_roi = cv2.cvtColor(finger_upper_roi, cv2.COLOR_BGR2GRAY)
                        blurred_roi = cv2.GaussianBlur(gray_roi, (5, 5), 0)
                        _, thresh_roi = cv2.threshold(blurred_roi, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

                        nail_contours, _ = cv2.findContours(thresh_roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                        if nail_contours:
                            c_nail = max(nail_contours, key=cv2.contourArea)
                            xn, yn, wn, hn = cv2.boundingRect(c_nail)
                            nail_x = xf + xn
                            nail_y = yf + yn
                            nail_w = wn
                            nail_h = hn
                            nail_found = True

                    if not nail_found:
                        nail_x = xf
                        nail_y = yf
                        nail_w = wf
                        nail_h = int(hf * 0.45)

                    # Crop to square around the nail plate with 5% padding
                    pad_w = int(nail_w * 0.05)
                    pad_h = int(nail_h * 0.05)
                    x_start = max(0, nail_x - pad_w)
                    y_start = max(0, nail_y - pad_h)
                    x_end = min(cw2, nail_x + nail_w + pad_w)
                    y_end = min(ch2, nail_y + nail_h + pad_h)

                    crop_cw = x_end - x_start
                    crop_ch = y_end - y_start
                    max_dim_sq = max(crop_cw, crop_ch)
                    center_x = (x_start + x_end) // 2
                    center_y = (y_start + y_end) // 2

                    sq_x1 = max(0, center_x - max_dim_sq // 2)
                    sq_y1 = max(0, center_y - max_dim_sq // 2)
                    sq_x2 = min(cw2, sq_x1 + max_dim_sq)
                    sq_y2 = min(ch2, sq_y1 + max_dim_sq)

                    roi = img[sq_y1:sq_y2, sq_x1:sq_x2]
                    if roi.size > 0:
                        img = roi
        except Exception:
            pass

        # Step 4: Fine Otsu refinement to tighten to the nail plate
        try:
            rh2, rw2 = img.shape[:2]
            if rh2 > 10 and rw2 > 10:
                gray_refine = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                blurred_refine = cv2.GaussianBlur(gray_refine, (5, 5), 0)
                _, thresh_refine = cv2.threshold(blurred_refine, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

                refine_contours, _ = cv2.findContours(thresh_refine, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                if refine_contours:
                    c_refine = max(refine_contours, key=cv2.contourArea)
                    if cv2.contourArea(c_refine) >= (rh2 * rw2 * 0.05):
                        xr, yr, wr, hr = cv2.boundingRect(c_refine)
                        pad_wr = int(wr * 0.03)
                        pad_hr = int(hr * 0.03)

                        rx1 = max(0, xr - pad_wr)
                        ry1 = max(0, yr - pad_hr)
                        rx2 = min(rw2, xr + wr + pad_wr)
                        ry2 = min(rh2, yr + hr + pad_hr)

                        rcw = rx2 - rx1
                        rch = ry2 - ry1
                        max_rd = max(rcw, rch)
                        rcx = (rx1 + rx2) // 2
                        rcy = (ry1 + ry2) // 2

                        sx1 = max(0, rcx - max_rd // 2)
                        sy1 = max(0, rcy - max_rd // 2)
                        sx2 = min(rw2, sx1 + max_rd)
                        sy2 = min(rh2, sy1 + max_rd)

                        refined = img[sy1:sy2, sx1:sx2]
                        if refined.size > 0:
                            img = refined
        except Exception:
            pass

    # Stage 3 (Grey World): Balance color channels to normalize lighting conditions
    try:
        b_mean = np.mean(img[:, :, 0])
        g_mean = np.mean(img[:, :, 1])
        r_mean = np.mean(img[:, :, 2])
        gray_avg = (b_mean + g_mean + r_mean) / 3.0
        if b_mean > 0: img[:, :, 0] = np.clip(img[:, :, 0] * (gray_avg / b_mean), 0, 255)
        if g_mean > 0: img[:, :, 1] = np.clip(img[:, :, 1] * (gray_avg / g_mean), 0, 255)
        if r_mean > 0: img[:, :, 2] = np.clip(img[:, :, 2] * (gray_avg / r_mean), 0, 255)
    except Exception:
        pass

    # Stage 4 (CLAHE): Enhance contrast in LAB space to bring out fine nail features
    try:
        lab = cv2.cvtColor(img.astype(np.uint8), cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        merged = cv2.merge((cl, a, b))
        img = cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
    except Exception:
        pass

    # Geometric Normalization (Letterboxing) to 384x384 to preserve aspect ratios

    target_size = 384
    try:
        h_roi, w_roi = img.shape[:2]
        scale = target_size / max(h_roi, w_roi)
        new_w = int(w_roi * scale)
        new_h = int(h_roi * scale)

        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)

        delta_w = target_size - new_w
        delta_h = target_size - new_h
        top, bottom = delta_h // 2, delta_h - (delta_h // 2)
        left, right = delta_w // 2, delta_w - (delta_w // 2)

        img = cv2.copyMakeBorder(resized, top, bottom, left, right, cv2.BORDER_CONSTANT, value=[0, 0, 0])
    except Exception:
        img = cv2.resize(img, (target_size, target_size), interpolation=cv2.INTER_CUBIC)

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Cast to model expectations
    dtype = input_details[0]['dtype']
    if dtype == np.uint8:
        img_array = np.clip(img, 0, 255).astype(np.uint8)
    elif dtype == np.int8:
        img_array = np.clip(img - 128, -128, 127).astype(np.int8)
    else:
        img_array = img.astype(np.float32)

    return np.expand_dims(img_array, axis=0)

@app.route('/predict', methods=['POST'])
def predict():
    if interpreter is None:
        return jsonify({'error': 'Model not loaded'}), 500
        
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
            
        # Decode base64 image
        image_data = base64.b64decode(data['image'])
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        # Preprocess
        input_data = preprocess_image(image, input_details)
        
        # Run inference
        interpreter.set_tensor(input_details[0]['index'], input_data)
        interpreter.invoke()
        output_data = interpreter.get_tensor(output_details[0]['index'])
        
        probabilities = output_data[0].tolist()
        
        return jsonify({
            'probabilities': probabilities
        })
        
    except Exception as e:
        import traceback
        print(f"Error during prediction: {e}\n{traceback.format_exc()}", flush=True)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run on all interfaces so iOS device can connect
    app.run(host='0.0.0.0', port=5000, debug=True)
