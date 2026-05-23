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
    id: 'nail_model_f16',
    weight: 1.0,
    inputSize: 384,
    nativeInputType: 'float32',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeSource: require('@/assets/models/nail_model_f16.tflite'),
  },
] as const;