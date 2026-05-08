# NailScan Inference Service Explained

## 1) Short App Screen and Redirect Overview

This app uses Expo Router with these main routes:

- `app/index.tsx`: splash route
- `app/(tabs)/index.tsx`: home (Diagnose tab)
- `app/capture.tsx`: capture/upload image
- `app/processing.tsx`: runs inference
- `app/result.tsx`: shows prediction and confidence
- `app/(tabs)/history.tsx`: saved scans list
- `app/history/[id].tsx`: scan details
- `app/(tabs)/about.tsx`: app info

Main redirect flow for diagnosis:

1. Splash route redirects to tabs: `router.replace('/(tabs)')`
2. Home starts scan: `router.push('/capture')`
3. Capture sends image to processing: `router.push({ pathname: '/processing', params: { imageUri } })`
4. Processing runs model, then redirects to result with prediction params: `router.replace('/result', params...)`
5. Result can save to history and go to history tab.

That is the UI flow. Everything below focuses on the inference service internals.

---

## 2) Where Inference Lives

Core inference logic is in:

- `services/tflite-inference.ts`
- Model registry is in `services/tflite-model-assets.ts`

The processing screen calls:

- `preloadTfliteModel()`
- `runTfliteInference(imageUri)`
- `getTfliteRuntimeMode()`

---

## 3) Connected Model and Runtime

The active model list is defined in `services/tflite-model-assets.ts`.

Current connected model:

- `id: mobilenetv3-float16`
- `inputSize: 384`
- `nativeInputType: float32`
- source: `assets/models/02_mobilenetv3_large_float16.tflite`

Even though the structure supports ensembling, this app is currently set to single-model mode (`ENSEMBLING_ENABLED = false`), so only the active float model is used.

Runtime modes returned by the service:

- `native-tflite`
- `native-fallback`

`native-tflite` is the expected path when native TFLite module is available.

---

## 4) End-to-End Image-to-Prediction Pipeline

This is the exact conceptual pipeline from captured/uploaded image to final label.

### Step A: Input Image Comes from Capture/Upload

In `app/capture.tsx`, image can come from:

- Camera capture (`takePictureAsync`) with automatic guide-based crop
- Camera with manual crop editor (`launchCameraAsync` with editing)
- Gallery upload with crop editor (`launchImageLibraryAsync` with editing)

Then the selected image URI is passed to processing.

Example (capture + auto-crop before setting URI):

```ts
const photo = await cameraRef.current?.takePictureAsync({ quality: 0.92, skipProcessing: false });
if (photo?.uri) {
  try {
    if (photo.width && photo.height) {
      const cropped = await cropToGuideRoi(photo.uri, photo.width, photo.height);
      setCapturedUri(cropped.uri);
    } else {
      setCapturedUri(photo.uri);
    }
  } catch {
    setCapturedUri(photo.uri);
  }
}
```

Code location: `app/capture.tsx`

### Step B: Processing Screen Triggers Inference

In `app/processing.tsx`:

- `runTfliteInference(imageUri)` is called
- A timeout guard is applied (`INFERENCE_TIMEOUT_MS = 25000`)
- On success, prediction values are forwarded to result route params (label, confidence, runtime, quality, debug probabilities)

Example (processing call):

```ts
Promise.race([runTfliteInference(params.imageUri), timeoutPromise])
  .then((result) => {
    setPrediction(result as TflitePrediction);
    setRuntimeMode(getTfliteRuntimeMode());
  })
  .catch((error) => {
    setInferenceError(error instanceof Error ? error.message : 'Inference failed unexpectedly.');
  });
```

Code location: `app/processing.tsx`

### Step C: Service Preprocessing (`preprocessNativeImageToRgb`)

In `services/tflite-inference.ts`, preprocessing is done before model execution.

1. Determine model input size (currently 384x384)
2. Try Android native preprocessor module (`NativeModules.NailPreprocessor`) first
3. If native preprocessor is unavailable/fails, JS preprocessing is used:
   - image resized to model size
   - JPEG decoded to RGB byte array
   - preprocessing pipeline selected:
     - fast path (`applyFastPreprocessing`) for low-end/single-model mode
     - full seven-step path (`applySevenStepPreprocessing`) otherwise

Example (native-preprocessor first, then JS fallback):

```ts
const nativePreprocessor = getNativePreprocessorModule();
if (Platform.OS === 'android' && nativePreprocessor) {
  const result = await nativePreprocessor.preprocessImage(imageUri);
  if (result?.available && result?.usedFullPipeline && result.rgbBase64) {
    const decoded = toByteArray(result.rgbBase64);
    if (decoded.length === modelInputSize * modelInputSize * 3) {
      const rgb = Uint8Array.from(decoded);
      return { rgbInput: rgb, quality: computeImageQualityMetadata(rgb, modelInputSize, modelInputSize) };
    }
  }
}
```

Code location: `services/tflite-inference.ts` (`preprocessNativeImageToRgb`)

### Step D: ROI and Quality-Aware Preprocessing

Important preprocessing ideas:

- HSV-based ROI extraction (`extractRoiBySkinMask`) attempts to isolate main nail/skin region
- Fast path still does ROI extraction (not just center crop)
- Full path includes denoise, white balance, luminance enhancement, sharpening, artifact suppression, ROI extraction, and per-channel normalization

This is why the model receives a cleaner and more nail-focused image tensor.

### Step E: Quality and Framing Metadata (`computeImageQualityMetadata`)

The service computes quality signals from the preprocessed image, including:

- brightness, contrast, sharpness, center focus
- dark pigment signals (`darkPigmentScore`, `darkCenterRatio`)
- framing metadata:
  - dominant region size ratio
  - number of significant components
  - framing score

These are used both for:

- UI feedback (`qualityFlags` shown in result)
- prediction guardrails (to avoid unreliable overconfident labels)

### Step F: Model Execution and Output Extraction

The service runs the model through native runtime and extracts output logits/probabilities.

Then it normalizes outputs (`normalizeOutputValues`) so results behave like probabilities even if raw tensor format differs.

Connected model registry snippet:

```ts
export const TFLITE_ENSEMBLE_MODELS: readonly TfliteModelSpec[] = [
  {
    id: 'mobilenetv3-float16',
    weight: 1,
    inputSize: 384,
    nativeInputType: 'float32',
    nativeSource: require('@/assets/models/02_mobilenetv3_large_float16.tflite'),
  },
];
```

Code location: `services/tflite-model-assets.ts`

### Step G: Probability Calibration and Clinical Guardrails (`mapToPrediction`)

This is the most important post-processing stage.

1. Apply temperature calibration (`calibrateProbabilities`)
2. Apply class-specific weighting (ALM, healthy, clubbing, onychogryphosis)
3. Apply safety guardrails with quality/framing conditions
4. Compute top-1, top-2 margin, adaptive confidence
5. Decide whether to keep predicted class or map to `unidentified`

Extra ALM handling includes:

- stricter thresholds to reduce false positives
- special pass-through for very strong ALM model evidence
- framing-based penalties when capture quality is poor

So the final returned label is not just raw argmax. It is model output plus rule-based safety logic.

Example (guardrail-style mapping):

```ts
let mappedLabel: DiagnosisLabel = confidence < minConfidenceForLabel
  ? 'unidentified'
  : candidateLabel;

if (mappedLabel === 'Acral Lentiginous Melanoma') {
  const strongAlmEvidence =
    darkPigmentScore >= 0.12 &&
    darkCenterRatio >= 0.1 &&
    margin >= 0.12 &&
    options.quality.qualityScore >= 0.58;

  if (!strongAlmEvidence && !isVeryStrongAlmByModel) {
    mappedLabel = healthyProb >= 0.24 && darkPigmentScore < 0.12 ? 'healthy' : 'unidentified';
  }
}
```

Code location: `services/tflite-inference.ts` (`mapToPrediction`)

### Step H: Result Payload Back to UI

Service returns `TflitePrediction`:

- `label`
- `confidence`
- `index`
- `runtimeMode`
- `inferenceTimeMs`
- `rawProbabilities`
- `qualityScore`
- `qualityFlags`

Processing screen passes these into result route params.

Result screen then:

- displays diagnosis and confidence
- shows model debug card (temporary)
- shows quality/capture improvement hints
- allows saving to history

Example (processing -> result redirect payload):

```ts
router.replace({
  pathname: '/result',
  params: {
    label,
    confidence: `${confidence}`,
    imageUri: params.imageUri ?? '',
    runtimeMode: mode,
    inferenceTimeMs: `${inferenceTimeMs}`,
    qualityScore: `${qualityScore}`,
    qualityFlags,
    debugProbabilities,
  },
});
```

Code location: `app/processing.tsx` (redirect) and `app/result.tsx` (consumption/display)

---

## 5) Why the Same Hand Can Produce Different Finger Results

Even on one hand, cropped finger images can produce different outputs because:

- framing quality differs per crop (single nail vs multiple components)
- exposure and reflection vary by finger angle
- ROI extraction can lock slightly differently depending on background and skin contrast
- post-processing guardrails change thresholds based on quality and framing metadata

So prediction stability depends on both model confidence and capture quality signals.

---

## 6) Practical Summary

In one line:

The app does not classify the raw camera photo directly; it crops/normalizes/quality-scores the image, runs a connected MobileNetV3 TFLite model, then applies safety-aware post-processing before producing the final label.

Companion diagram: [INFERENCE_PIPELINE_DIAGRAM.md](INFERENCE_PIPELINE_DIAGRAM.md), which visualizes the pipeline from capture through inference to result rendering.
