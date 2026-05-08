export type TfliteModelInputType = 'float32' | 'uint8' | 'int8';

export type TfliteModelQuantization = {
  scale: number;
  zeroPoint: number;
};

export type TfliteModelSpec = {
  id: string;
  weight: number;
  inputSize: number;
  nativeInputType: TfliteModelInputType;
  quantization?: TfliteModelQuantization;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nativeSource: any;
};

export const TFLITE_ENSEMBLE_MODELS: readonly TfliteModelSpec[] = [
  {
    id: 'MobileNetV3_nail_model_f16',
    weight: 1.0,
    inputSize: 384,
    nativeInputType: 'float32',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeSource: require('@/assets/models/MobileNetV3_nail_model_f16.tflite'),
  },
  {
    id: 'EfficientNetV2B2_nail_model_f16',
    weight: 1.0,
    inputSize: 384,
    nativeInputType: 'float32',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeSource: require('@/assets/models/EfficientNetV2B2_nail_model_f16.tflite'),
  },
  {
    id: '02_mobilenetv3_large_int8',
    weight: 1.0,
    inputSize: 384,
    nativeInputType: 'int8',
    // Default int8 quantization for TFLite usually maps [0, 255] to [-128, 127]
    quantization: { scale: 1.0, zeroPoint: -128 },
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeSource: require('@/assets/models/02_mobilenetv3_large_int8.tflite'),
  },
] as const;