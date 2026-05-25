# Nail Health AI - Application Summary

Nail Health AI is a mobile application built with React Native and Expo that uses a TensorFlow Lite machine learning model to analyze images of fingernails and detect potential health conditions.

## Architecture Overview

The application has two main components:
1. **Frontend (React Native / Expo)**: A mobile app that handles user interactions, camera capturing, image uploading, and displaying detailed analysis results.
2. **Backend (Python / Flask)**: An optional Python inference server (`server.py`) used for testing or offloading predictions. 

## Key Features

- **Nail Scanning**: Users can capture a live photo or upload an existing image of their nails.
- **AI Inference**: The app utilizes a TensorFlow Lite model (`newmodel.tflite`) to predict nail conditions such as clubbing, beau lines, pitting, cyanosis (blue finger), koilonychia, acral lentiginous melanoma, and muehrckes lines.
- **Image Preprocessing**: Both the Python server and the native app (via `tflite-inference.ts` and OpenCV) run a robust image preprocessing pipeline:
  - **Skin Detection & Otsu's Thresholding**: Isolates the nail bed from the background to create a tight crop around the nail plate.
  - **Grey-world Color Correction**: Balances color channels to normalize different lighting conditions.
  - **CLAHE Contrast Enhancement**: Enhances fine nail features like ridges or pitting.
- **Detailed Results View**: The app provides a beautiful, glassmorphic UI (`result-view.tsx`) that displays:
  - The predicted condition and a confidence score.
  - An "AI Nail Focus Area" modal to visualize the exact region the model analyzed (bounding box).
  - Detailed condition analysis (shape, color, texture, causes).
  - Treatment/care recommendations and tips.

## How the Inference Service Works

The inference service bridges the gap between the mobile frontend and the machine learning model. It is designed for flexibility, supporting both on-device inference and server-side fallback.

1. **Dual-Mode Execution**:
   - **On-Device (Native)**: By default, the app attempts to use `react-native-fast-tflite` to run the TensorFlow Lite model directly on the user's device. This ensures fast predictions without requiring an active internet connection and keeps user data private.
   - **Server Fallback**: If the native TFLite module is unavailable or encounters an error, the app can seamlessly fall back to making an HTTP POST request to the Python Flask server (`server.py`) with a base64 encoded image.

2. **Preprocessing Pipeline**: 
   - Before inference, images undergo several critical preprocessing steps: squaring the crop, detecting the finger via HSV skin masking, applying Otsu's thresholding to isolate the nail plate, grey-world color correction to handle different lighting, and CLAHE for contrast enhancement.
   - The native version mimics the exact OpenCV logic found in the Python server to guarantee consistent predictions regardless of the execution mode.

3. **Prediction & Confidence Scoring**:
   - The model outputs a set of raw probabilities for each class.
   - A threshold logic is applied to generate the final `confidence` score. If the confidence doesn't meet specific thresholds (e.g., < 44%), it safely classifies the image as "Unidentified" to prevent false diagnoses.
   - Quality metrics (like blurriness or poor lighting) also factor into the final result, adjusting the confidence score or setting quality flags.

## Technologies Used

- **Frontend**: React Native, Expo, React Navigation, Expo Router
- **Backend / Inference**: Python, Flask, TensorFlow Lite, OpenCV, NumPy, Pillow
- **Local On-Device Inference**: `react-native-fast-tflite`
