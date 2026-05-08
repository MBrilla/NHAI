# NailScan (React Native + Native TFLite)

NailScan is a native React Native app that runs MobileNetV3 TFLite inference through `react-native-fast-tflite`.

## Runtime Design

- Native-only inference path (Android/iOS). Web inference is intentionally disabled.
- Active model assets:
  - `assets/models/02_mobilenetv3_large_float16.tflite`
  - `assets/models/02_mobilenetv3_large_int8.tflite`
- Class index map:
  - `0: Acral Lentiginous Melanoma`
  - `1: clubbing`
  - `2: healthy`
  - `3: onychogryphosis`

Inference entry points:

- `services/tflite-inference.ts`
- `app/processing.tsx`

Runtime modes:

- `native-tflite`: model-backed inference
- `native-fallback`: fallback mode when native runtime is unavailable

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)

For Android native inference, build and run:

```bash
npx expo run:android
```

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Notes

- Use a development build (not Expo Go) for native TFLite inference.
- If stale assets appear in Android builds, clear Metro and Gradle caches before rebuilding.
