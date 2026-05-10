import { toByteArray } from 'base64-js';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';
import { Image, NativeModules, Platform, TurboModuleRegistry } from 'react-native';

import { CLASS_LABELS, type DiagnosisLabel } from '@/data/diagnosis';
import {
  TFLITE_ENSEMBLE_MODELS,
  type TfliteModelInputType,
  type TfliteModelSpec,
} from '@/services/tflite-model-assets';

export interface TflitePrediction {
  label: DiagnosisLabel;
  confidence: number;
  index: number;
  runtimeMode: TfliteRuntimeMode;
  inferenceTimeMs: number;
  rawProbabilities: number[];
  qualityScore: number;
  qualityFlags: string[];
  roi?: { x: number; y: number; width: number; height: number };
}

export interface InferenceQualityMetadata {
  brightness: number;
  contrast: number;
  sharpness: number;
  centerFocus: number;
  darkPigmentScore: number;
  darkCenterRatio: number;
  dominantRegionRatio: number;
  componentCount: number;
  framingScore: number;
  qualityScore: number;
  qualityFlags: string[];
}

export type TfliteRuntimeMode = 'native-tflite' | 'native-fallback';

const NATIVE_TEMPERATURE = 0.65;
const LOW_END_INFERENCE_BUDGET_MS = 700;
const LOW_CONFIDENCE_UNIDENTIFIED_THRESHOLD = 0.44;
const ENSEMBLING_ENABLED = true;

const ALM_INDEX = CLASS_LABELS.indexOf('Acral Lentiginous Melanoma');
const CLUBBING_INDEX = CLASS_LABELS.indexOf('clubbing');
const HEALTHY_INDEX = CLASS_LABELS.indexOf('healthy');
const ONYCHOGRYPHOSIS_INDEX = CLASS_LABELS.indexOf('onychogryphosis');

type NativePreprocessorResult = {
  available?: boolean;
  usedFullPipeline?: boolean;
  rgbBase64?: string;
  width?: number;
  height?: number;
  preprocessingMs?: number;
};

type NativePreprocessorModule = {
  preprocessImage: (imageUri: string) => Promise<NativePreprocessorResult>;
  isAvailable?: () => Promise<{ available: boolean }>;
};

type PreprocessingResult = {
  rgb: Uint8Array;
  roi?: { x: number; y: number; width: number; height: number };
};


type NativeTensorflowModel = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (inputs: any[]) => Promise<any[]>;
};

let nativeLoadTensorflowModel: ((modelSource: any, delegate?: any) => Promise<NativeTensorflowModel>) | null = null;
const nativeModelPromises: Record<string, Promise<NativeTensorflowModel>> = {};
const nativeModels: Record<string, NativeTensorflowModel> = {};
let runtimeMode: TfliteRuntimeMode = 'native-fallback';
let singleModelMode = !ENSEMBLING_ENABLED;
let isWarmedUp = false;
const MAX_MEMORY_MB = 200; // Threshold for OOM safeguard
const MAX_DIRECT_DECODE_PIXELS = 6_000_000;
let memoryWarningCount = 0;

function getModelInputSize(): number {
  const activeModels = getActiveEnsembleModels();
  return activeModels[0]?.inputSize ?? 384;
}

// Warmup inference to compile NNAPI/delegate kernels and eliminate first-run latency jitter.
async function warmupModel(model: NativeTensorflowModel, modelInputSize: number): Promise<void> {
  try {
    // Use a zero-filled input (fastest, avoids I/O).
    const warmupInput = new Float32Array(modelInputSize * modelInputSize * 3);
    await model.run([warmupInput]);
  } catch {
    // Warmup failure is non-fatal; inference proceeds without precompiled kernels.
  }
}

const NATIVE_RUNTIME_UNAVAILABLE_MESSAGE =
  'Native TFLite runtime is unavailable in this app build. Rebuild with `npx expo run:android` and open the development build (not Expo Go).';

function hasNativeTfliteTurboModule(): boolean {
  try {
    return typeof TurboModuleRegistry?.get === 'function' && !!TurboModuleRegistry.get('Tflite');
  } catch {
    return false;
  }
}

function getNativePreprocessorModule(): NativePreprocessorModule | null {
  const mod = (NativeModules as { NailPreprocessor?: NativePreprocessorModule }).NailPreprocessor;
  return mod ?? null;
}

function clampByte(value: number): number {
  if (value <= 0) return 0;
  if (value >= 255) return 255;
  return value;
}

function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function computeDarkPigmentMetadata(
  rgb: Uint8Array,
  width: number,
  height: number
): { darkPigmentScore: number; darkCenterRatio: number } {
  const pixelCount = Math.max(1, width * height);
  const centerMinX = Math.floor(width * 0.2);
  const centerMaxX = Math.ceil(width * 0.8);
  const centerMinY = Math.floor(height * 0.2);
  const centerMaxY = Math.ceil(height * 0.8);

  let darkCount = 0;
  let centerDarkCount = 0;
  let centerPixelCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const r = rgb[idx];
      const g = rgb[idx + 1];
      const b = rgb[idx + 2];
      const val = Math.max(r, g, b);
      const sat = val <= 0 ? 0 : ((val - Math.min(r, g, b)) / val) * 255;

      const darkPixel = val < 82 && sat < 95;
      if (darkPixel) {
        darkCount += 1;
      }

      if (x >= centerMinX && x <= centerMaxX && y >= centerMinY && y <= centerMaxY) {
        centerPixelCount += 1;
        if (darkPixel) {
          centerDarkCount += 1;
        }
      }
    }
  }

  const darkRatio = darkCount / pixelCount;
  const centerDarkRatio = centerPixelCount > 0 ? centerDarkCount / centerPixelCount : darkRatio;
  // Center-dark pixels are weighted higher because nail lesion cues are expected near the nail plate center.
  const darkPigmentScore = clamp01(0.45 * darkRatio + 0.55 * centerDarkRatio);

  return {
    darkPigmentScore,
    darkCenterRatio: centerDarkRatio,
  };
}

function computeFramingMetadata(
  rgb: Uint8Array,
  width: number,
  height: number
): { dominantRegionRatio: number; componentCount: number; framingScore: number } {
  const pixelCount = Math.max(1, width * height);
  const mask = new Uint8Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 3;
    const { h, s, v } = rgbToHsv(rgb[idx], rgb[idx + 1], rgb[idx + 2]);
    const inRange1 = h >= 0 && h <= 25 && s >= 15 && v >= 60;
    const inRange2 = h >= 155 && h <= 180 && s >= 15 && v >= 60;
    mask[i] = inRange1 || inRange2 ? 1 : 0;
  }

  const visited = new Uint8Array(pixelCount);
  const minComponentArea = Math.max(36, Math.round(pixelCount * 0.0035));
  let componentCount = 0;
  let largestArea = 0;
  let largestCx = width / 2;
  let largestCy = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const start = y * width + x;
      if (!mask[start] || visited[start]) continue;

      const queue = [start];
      visited[start] = 1;
      let head = 0;
      let area = 0;
      let sumX = 0;
      let sumY = 0;

      while (head < queue.length) {
        const current = queue[head++];
        const cy = Math.floor(current / width);
        const cx = current - cy * width;
        area += 1;
        sumX += cx;
        sumY += cy;

        const neighbors = [current - 1, current + 1, current - width, current + width];
        for (const n of neighbors) {
          if (n < 0 || n >= pixelCount) continue;
          const ny = Math.floor(n / width);
          const nx = n - ny * width;
          if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;
          if (!mask[n] || visited[n]) continue;
          visited[n] = 1;
          queue.push(n);
        }
      }

      if (area < minComponentArea) {
        continue;
      }

      componentCount += 1;
      if (area > largestArea) {
        largestArea = area;
        largestCx = sumX / area;
        largestCy = sumY / area;
      }
    }
  }

  const dominantRegionRatio = largestArea / pixelCount;
  const normDx = (largestCx - width / 2) / (width / 2 + 1e-6);
  const normDy = (largestCy - height / 2) / (height / 2 + 1e-6);
  const centerOffset = Math.min(1, Math.sqrt(normDx * normDx + normDy * normDy));

  const sizeScore = clamp01((dominantRegionRatio - 0.1) / 0.38);
  const singleSubjectScore = componentCount <= 1 ? 1 : componentCount === 2 ? 0.72 : componentCount === 3 ? 0.48 : 0.24;
  const centeringScore = clamp01(1 - centerOffset);
  const framingScore = clamp01(0.55 * sizeScore + 0.3 * singleSubjectScore + 0.15 * centeringScore);

  return {
    dominantRegionRatio,
    componentCount,
    framingScore,
  };
}

function computeImageQualityMetadata(rgb: Uint8Array, width: number, height: number): InferenceQualityMetadata {
  const pigment = computeDarkPigmentMetadata(rgb, width, height);
  const framing = computeFramingMetadata(rgb, width, height);
  const pixelCount = Math.max(1, width * height);
  let lumaSum = 0;
  let lumaSqSum = 0;

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 3;
    const y = luma(rgb[idx], rgb[idx + 1], rgb[idx + 2]);
    lumaSum += y;
    lumaSqSum += y * y;
  }

  const meanLuma = lumaSum / pixelCount;
  const variance = Math.max(0, lumaSqSum / pixelCount - meanLuma * meanLuma);
  const stdLuma = Math.sqrt(variance);
  const brightness = clamp01(meanLuma / 255);
  const contrast = clamp01(stdLuma / 96);

  let gradientSum = 0;
  let gradientCount = 0;
  let centerGradientSum = 0;
  let centerGradientCount = 0;
  const centerMinX = Math.floor(width * 0.22);
  const centerMaxX = Math.ceil(width * 0.78);
  const centerMinY = Math.floor(height * 0.22);
  const centerMaxY = Math.ceil(height * 0.78);

  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const idx = (y * width + x) * 3;
      const right = (y * width + (x + 1)) * 3;
      const down = ((y + 1) * width + x) * 3;
      const center = luma(rgb[idx], rgb[idx + 1], rgb[idx + 2]);
      const gx = Math.abs(center - luma(rgb[right], rgb[right + 1], rgb[right + 2]));
      const gy = Math.abs(center - luma(rgb[down], rgb[down + 1], rgb[down + 2]));
      const grad = Math.sqrt(gx * gx + gy * gy);
      gradientSum += grad;
      gradientCount += 1;

      if (x >= centerMinX && x <= centerMaxX && y >= centerMinY && y <= centerMaxY) {
        centerGradientSum += grad;
        centerGradientCount += 1;
      }
    }
  }

  const globalGradient = gradientCount > 0 ? gradientSum / gradientCount : 0;
  const centerGradient = centerGradientCount > 0 ? centerGradientSum / centerGradientCount : globalGradient;
  const sharpness = clamp01(globalGradient / 28);
  const centerFocus = clamp01(centerGradient / (globalGradient + 1e-6));

  const exposureScore = 1 - clamp01(Math.abs(brightness - 0.56) / 0.35);
  const contrastScore = clamp01((contrast - 0.18) / 0.58);
  const sharpnessScore = clamp01((sharpness - 0.2) / 0.7);
  const centerScore = clamp01((centerFocus - 0.74) / 0.4);
  const framingScore = framing.framingScore;
  const qualityScore = clamp01(
    0.31 * exposureScore +
      0.24 * contrastScore +
      0.18 * sharpnessScore +
      0.1 * centerScore +
      0.17 * framingScore
  );

  const qualityFlags: string[] = [];
  if (brightness < 0.27) qualityFlags.push('Image appears underexposed. Increase lighting.');
  if (brightness > 0.87) qualityFlags.push('Image appears overexposed. Reduce direct light or flash.');
  if (contrast < 0.2) qualityFlags.push('Image has low contrast. Place nail against a neutral background.');
  if (sharpness < 0.22) qualityFlags.push('Image looks blurry. Hold steady and move slightly closer.');
  if (centerFocus < 0.78) qualityFlags.push('Center the nail more clearly inside the guide frame.');
  if (framing.dominantRegionRatio < 0.14) {
    qualityFlags.push('Move closer so one nail region fills most of the frame.');
  }
  if (framing.componentCount >= 3) {
    qualityFlags.push('Keep only one fingernail visible. Multiple nails reduce reliability.');
  }
  if (pigment.darkPigmentScore > 0.11) qualityFlags.push('Dark-pigment pattern detected. Verify lesion-focused framing.');

  return {
    brightness,
    contrast,
    sharpness,
    centerFocus,
    darkPigmentScore: pigment.darkPigmentScore,
    darkCenterRatio: pigment.darkCenterRatio,
    dominantRegionRatio: Number(framing.dominantRegionRatio.toFixed(4)),
    componentCount: framing.componentCount,
    framingScore: Number(framingScore.toFixed(4)),
    qualityScore,
    qualityFlags,
  };
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta > 1e-6) {
    if (max === rn) {
      h = 60 * (((gn - bn) / delta) % 6);
    } else if (max === gn) {
      h = 60 * ((bn - rn) / delta + 2);
    } else {
      h = 60 * ((rn - gn) / delta + 4);
    }
  }
  if (h < 0) h += 360;

  const s = max <= 1e-6 ? 0 : (delta / max) * 255;
  const v = max * 255;
  return { h, s, v };
}

function blurRgb(src: Float32Array, width: number, height: number): Float32Array {
  const out = new Float32Array(src.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const accum = [0, 0, 0];
      let count = 0;
      for (let ky = -1; ky <= 1; ky++) {
        const yy = y + ky;
        if (yy < 0 || yy >= height) continue;
        for (let kx = -1; kx <= 1; kx++) {
          const xx = x + kx;
          if (xx < 0 || xx >= width) continue;
          const srcIdx = (yy * width + xx) * 3;
          accum[0] += src[srcIdx];
          accum[1] += src[srcIdx + 1];
          accum[2] += src[srcIdx + 2];
          count += 1;
        }
      }
      const dstIdx = (y * width + x) * 3;
      out[dstIdx] = accum[0] / count;
      out[dstIdx + 1] = accum[1] / count;
      out[dstIdx + 2] = accum[2] / count;
    }
  }
  return out;
}

function bilateralDenoiseApprox(src: Float32Array, width: number, height: number): Float32Array {
  const out = new Float32Array(src.length);
  const sigmaSpace = 1.0;
  const sigmaColor = 25;
  const spatialW = [
    Math.exp(-2 / (2 * sigmaSpace * sigmaSpace)),
    Math.exp(-1 / (2 * sigmaSpace * sigmaSpace)),
    1,
    Math.exp(-1 / (2 * sigmaSpace * sigmaSpace)),
    Math.exp(-2 / (2 * sigmaSpace * sigmaSpace)),
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const cr = src[idx];
      const cg = src[idx + 1];
      const cb = src[idx + 2];
      let wr = 0;
      let wg = 0;
      let wb = 0;
      let sumW = 0;

      for (let ky = -2; ky <= 2; ky++) {
        const yy = y + ky;
        if (yy < 0 || yy >= height) continue;
        for (let kx = -2; kx <= 2; kx++) {
          const xx = x + kx;
          if (xx < 0 || xx >= width) continue;
          const nIdx = (yy * width + xx) * 3;
          const nr = src[nIdx];
          const ng = src[nIdx + 1];
          const nb = src[nIdx + 2];
          const dc = luma(nr - cr, ng - cg, nb - cb);
          const colorW = Math.exp(-(dc * dc) / (2 * sigmaColor * sigmaColor));
          const spatial = spatialW[Math.abs(ky)] * spatialW[Math.abs(kx)];
          const w = colorW * spatial;
          wr += nr * w;
          wg += ng * w;
          wb += nb * w;
          sumW += w;
        }
      }

      out[idx] = sumW > 0 ? wr / sumW : cr;
      out[idx + 1] = sumW > 0 ? wg / sumW : cg;
      out[idx + 2] = sumW > 0 ? wb / sumW : cb;
    }
  }

  return out;
}

function dilateMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let on = 0;
      for (let ky = -1; ky <= 1 && !on; ky++) {
        const yy = y + ky;
        if (yy < 0 || yy >= height) continue;
        for (let kx = -1; kx <= 1; kx++) {
          const xx = x + kx;
          if (xx < 0 || xx >= width) continue;
          if (mask[yy * width + xx] > 0) {
            on = 1;
            break;
          }
        }
      }
      out[y * width + x] = on;
    }
  }
  return out;
}

function erodeMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let on = 1;
      for (let ky = -1; ky <= 1 && on; ky++) {
        const yy = y + ky;
        if (yy < 0 || yy >= height) {
          on = 0;
          break;
        }
        for (let kx = -1; kx <= 1; kx++) {
          const xx = x + kx;
          if (xx < 0 || xx >= width || mask[yy * width + xx] === 0) {
            on = 0;
            break;
          }
        }
      }
      out[y * width + x] = on;
    }
  }
  return out;
}

function findLargestMaskBoundingBox(mask: Uint8Array, width: number, height: number):
  | { minX: number; minY: number; maxX: number; maxY: number; area: number }
  | null {
  const visited = new Uint8Array(mask.length);
  let best: { minX: number; minY: number; maxX: number; maxY: number; area: number } | null = null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const start = y * width + x;
      if (!mask[start] || visited[start]) continue;

      const queue = [start];
      visited[start] = 1;
      let head = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let area = 0;

      while (head < queue.length) {
        const current = queue[head++];
        const cy = Math.floor(current / width);
        const cx = current - cy * width;
        area += 1;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const neighbors = [current - 1, current + 1, current - width, current + width];
        for (const n of neighbors) {
          if (n < 0 || n >= mask.length) continue;
          const ny = Math.floor(n / width);
          const nx = n - ny * width;
          if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;
          if (!mask[n] || visited[n]) continue;
          visited[n] = 1;
          queue.push(n);
        }
      }

      if (!best || area > best.area) {
        best = { minX, minY, maxX, maxY, area };
      }
    }
  }

  return best;
}

function resizeRgbBilinear(src: Float32Array, srcW: number, srcH: number, dstW: number, dstH: number): Float32Array {
  const out = new Float32Array(dstW * dstH * 3);
  const scaleX = srcW / dstW;
  const scaleY = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    const sy = (y + 0.5) * scaleY - 0.5;
    const y0 = Math.max(0, Math.min(srcH - 1, Math.floor(sy)));
    const y1 = Math.max(0, Math.min(srcH - 1, y0 + 1));
    const wy = sy - y0;
    for (let x = 0; x < dstW; x++) {
      const sx = (x + 0.5) * scaleX - 0.5;
      const x0 = Math.max(0, Math.min(srcW - 1, Math.floor(sx)));
      const x1 = Math.max(0, Math.min(srcW - 1, x0 + 1));
      const wx = sx - x0;

      const p00 = (y0 * srcW + x0) * 3;
      const p01 = (y0 * srcW + x1) * 3;
      const p10 = (y1 * srcW + x0) * 3;
      const p11 = (y1 * srcW + x1) * 3;
      const dst = (y * dstW + x) * 3;

      for (let c = 0; c < 3; c++) {
        const top = src[p00 + c] * (1 - wx) + src[p01 + c] * wx;
        const bottom = src[p10 + c] * (1 - wx) + src[p11 + c] * wx;
        out[dst + c] = top * (1 - wy) + bottom * wy;
      }
    }
  }

  return out;
}

function extractRoiBySkinMask(rgb: Float32Array, width: number, height: number): {
  rgb: Float32Array;
  roi: { x: number; y: number; width: number; height: number };
} {
  const mask: Uint8Array<ArrayBufferLike> = new Uint8Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 3;
    const { h, s, v } = rgbToHsv(rgb[idx], rgb[idx + 1], rgb[idx + 2]);
    const inRange1 = h >= 0 && h <= 25 && s >= 15 && v >= 60;
    const inRange2 = h >= 155 && h <= 180 && s >= 15 && v >= 60;
    mask[i] = inRange1 || inRange2 ? 1 : 0;
  }

  let refined: Uint8Array<ArrayBufferLike> = mask;
  for (let i = 0; i < 2; i++) refined = dilateMask(refined, width, height);
  for (let i = 0; i < 1; i++) refined = erodeMask(refined, width, height);

  const best = findLargestMaskBoundingBox(refined, width, height);
  const imageArea = width * height;
  if (!best || best.area / imageArea <= 0.05) {
    const crop = getCenterCrop(width, height, 0.1);
    const cropped = new Float32Array(crop.width * crop.height * 3);
    for (let y = 0; y < crop.height; y++) {
      for (let x = 0; x < crop.width; x++) {
        const src = ((crop.originY + y) * width + (crop.originX + x)) * 3;
        const dst = (y * crop.width + x) * 3;
        cropped[dst] = rgb[src];
        cropped[dst + 1] = rgb[src + 1];
        cropped[dst + 2] = rgb[src + 2];
      }
    }
    return {
      rgb: resizeRgbBilinear(cropped, crop.width, crop.height, width, height),
      roi: { x: crop.originX, y: crop.originY, width: crop.width, height: crop.height }
    };
  }

  const pad = 15;
  const skinMinX = Math.max(0, best.minX - pad);
  const skinMinY = Math.max(0, best.minY - pad);
  const skinMaxX = Math.min(width - 1, best.maxX + pad);
  const skinMaxY = Math.min(height - 1, best.maxY + pad);
  const skinW = Math.max(1, skinMaxX - skinMinX + 1);
  const skinH = Math.max(1, skinMaxY - skinMinY + 1);

  // --- Narrow from "skin region" to "nail region" ---
  // The skin mask captures the whole finger/hand. The nail is a small,
  // roughly rectangular area that typically sits in the upper-center of the
  // finger. We estimate the nail's position by taking approximately the
  // top 45% vertically and center 65% horizontally of the skin bounding box.
  // This produces a tight crop that closely matches the training data
  // (close-up nail images).
  const skinAspect = skinW / skinH;
  const skinAreaRatio = (skinW * skinH) / imageArea;

  // Only apply nail-narrowing if the skin region is large enough that it
  // likely contains more than just the nail (i.e. includes finger/hand skin).
  // If the skin region is already small (<20% of the image), the user has
  // likely already framed the nail tightly and we should not over-crop.
  let nailMinX: number;
  let nailMinY: number;
  let nailW: number;
  let nailH: number;

  if (skinAreaRatio > 0.25) {
    // Large skin region detected – narrow down to estimated nail area
    const narrowHorizontal = 0.65;  // use center 65% of width
    
    const horzInset = skinW * ((1 - narrowHorizontal) / 2);
    nailMinX = Math.max(0, Math.round(skinMinX + horzInset));
    nailW = Math.max(1, Math.round(skinW * narrowHorizontal));

    if (skinAspect > 1.3) {
      // Finger appears to be horizontal – nail could be at either end.
      // Use center crop vertically.
      const vertInset = skinH * ((1 - 0.70) / 2);
      nailMinY = Math.max(0, Math.round(skinMinY + vertInset));
      nailH = Math.max(1, Math.round(skinH * 0.70));
    } else {
      // Finger is vertical or roughly square.
      // Take the middle 70% of the skin bounding box, but shift it upwards
      // by 10% since the nail is on the distal half. This safely captures the nail
      // whether it is centered in the camera frame or at the very tip of a finger.
      const narrowVertical = 0.70;
      const vertInset = skinH * ((1 - narrowVertical) / 2);
      const shiftUp = skinH * 0.10;
      nailMinY = Math.max(skinMinY, Math.round(skinMinY + vertInset - shiftUp));
      nailH = Math.max(1, Math.round(skinH * narrowVertical));
    }
  } else {
    // Small/moderate skin region – use the full skin bounding box
    nailMinX = skinMinX;
    nailMinY = skinMinY;
    nailW = skinW;
    nailH = skinH;
  }

  // Clamp to image bounds
  nailMinX = Math.max(0, Math.min(width - 1, nailMinX));
  nailMinY = Math.max(0, Math.min(height - 1, nailMinY));
  nailW = Math.min(nailW, width - nailMinX);
  nailH = Math.min(nailH, height - nailMinY);

  const roi = new Float32Array(nailW * nailH * 3);
  for (let y = 0; y < nailH; y++) {
    for (let x = 0; x < nailW; x++) {
      const src = ((nailMinY + y) * width + (nailMinX + x)) * 3;
      const dst = (y * nailW + x) * 3;
      roi[dst] = rgb[src];
      roi[dst + 1] = rgb[src + 1];
      roi[dst + 2] = rgb[src + 2];
    }
  }

  return {
    rgb: resizeRgbBilinear(roi, nailW, nailH, width, height),
    roi: { x: nailMinX, y: nailMinY, width: nailW, height: nailH }
  };
}

function equalizeLuminance(rgb: Float32Array, width: number, height: number): Float32Array {
  const totalPixels = width * height;
  const hist = new Uint32Array(256);
  const yBuffer = new Uint8Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 3;
    const y = clampByte(0.299 * rgb[idx] + 0.587 * rgb[idx + 1] + 0.114 * rgb[idx + 2]);
    const yInt = y | 0;
    yBuffer[i] = yInt;
    hist[yInt] += 1;
  }

  const cdf = new Uint32Array(256);
  let cumulative = 0;
  for (let i = 0; i < 256; i++) {
    cumulative += hist[i];
    cdf[i] = cumulative;
  }

  const cdfMin = cdf.find((v) => v > 0) ?? 0;
  const denom = Math.max(1, totalPixels - cdfMin);
  const out = new Float32Array(rgb.length);

  for (let i = 0; i < totalPixels; i++) {
    const oldY = yBuffer[i];
    const newY = clampByte(((cdf[oldY] - cdfMin) / denom) * 255);
    const ratio = oldY > 0 ? newY / oldY : 1;
    const idx = i * 3;
    out[idx] = clampByte(rgb[idx] * ratio);
    out[idx + 1] = clampByte(rgb[idx + 1] * ratio);
    out[idx + 2] = clampByte(rgb[idx + 2] * ratio);
  }

  return out;
}

function removeDarkLineArtifacts(rgb: Float32Array, width: number, height: number): Float32Array {
  const out = new Float32Array(rgb);
  let darkCount = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 3;
      const r = out[idx];
      const g = out[idx + 1];
      const b = out[idx + 2];
      const centerLuma = luma(r, g, b);
      if (centerLuma > 40) continue;
      darkCount += 1;

      let brightNeighbors = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let count = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          if (kx === 0 && ky === 0) continue;
          const nIdx = ((y + ky) * width + (x + kx)) * 3;
          const nr = out[nIdx];
          const ng = out[nIdx + 1];
          const nb = out[nIdx + 2];
          const nLuma = luma(nr, ng, nb);
          if (nLuma > centerLuma + 25) {
            brightNeighbors += 1;
          }
          sumR += nr;
          sumG += ng;
          sumB += nb;
          count += 1;
        }
      }

      if (brightNeighbors >= 4 && count > 0) {
        out[idx] = sumR / count;
        out[idx + 1] = sumG / count;
        out[idx + 2] = sumB / count;
      }
    }
  }

  const artifactRatio = darkCount / (width * height);
  if (artifactRatio < 0.001 || artifactRatio > 0.15) {
    return rgb;
  }
  return out;
}

function normalizeRgbChannels(rgb: Float32Array): Float32Array {
  const out = new Float32Array(rgb.length);
  const means = [0, 0, 0];
  const stds = [0, 0, 0];
  const n = rgb.length / 3;

  for (let i = 0; i < n; i++) {
    const idx = i * 3;
    means[0] += rgb[idx];
    means[1] += rgb[idx + 1];
    means[2] += rgb[idx + 2];
  }
  means[0] /= n;
  means[1] /= n;
  means[2] /= n;

  for (let i = 0; i < n; i++) {
    const idx = i * 3;
    stds[0] += (rgb[idx] - means[0]) ** 2;
    stds[1] += (rgb[idx + 1] - means[1]) ** 2;
    stds[2] += (rgb[idx + 2] - means[2]) ** 2;
  }
  stds[0] = Math.sqrt(stds[0] / n) + 1e-6;
  stds[1] = Math.sqrt(stds[1] / n) + 1e-6;
  stds[2] = Math.sqrt(stds[2] / n) + 1e-6;

  for (let i = 0; i < n; i++) {
    const idx = i * 3;
    out[idx] = clampByte(((rgb[idx] - means[0]) / stds[0]) * 50 + 128);
    out[idx + 1] = clampByte(((rgb[idx + 1] - means[1]) / stds[1]) * 50 + 128);
    out[idx + 2] = clampByte(((rgb[idx + 2] - means[2]) / stds[2]) * 50 + 128);
  }

  return out;
}

function applySevenStepPreprocessing(rgbBytes: Uint8Array, width: number, height: number): PreprocessingResult {
  const base = Float32Array.from(rgbBytes, (v) => v);

  // --- Match training pipeline order: ROI → CLAHE → Color Constancy → Blur ---

  // 1) ROI extraction (HSV mask based) – training applies this FIRST.
  const { rgb: roiRgb, roi } = extractRoiBySkinMask(base, width, height);

  // 2) CLAHE-like luminance enhancement (blended to avoid overamplification)
  const equalized = equalizeLuminance(roiRgb, width, height);
  const contrast = new Float32Array(equalized.length);
  for (let i = 0; i < equalized.length; i++) {
    contrast[i] = clampByte(0.7 * equalized[i] + 0.3 * roiRgb[i]);
  }

  // 3) Gray-world white balance (color constancy)
  const channelMeans = [0, 0, 0];
  const count = width * height;
  for (let i = 0; i < contrast.length; i += 3) {
    channelMeans[0] += contrast[i];
    channelMeans[1] += contrast[i + 1];
    channelMeans[2] += contrast[i + 2];
  }
  channelMeans[0] /= count;
  channelMeans[1] /= count;
  channelMeans[2] /= count;
  const gray = (channelMeans[0] + channelMeans[1] + channelMeans[2]) / 3;
  const balanced = new Float32Array(contrast.length);
  const scales = [gray / (channelMeans[0] + 1e-6), gray / (channelMeans[1] + 1e-6), gray / (channelMeans[2] + 1e-6)];
  for (let i = 0; i < contrast.length; i += 3) {
    balanced[i] = clampByte(contrast[i] * scales[0]);
    balanced[i + 1] = clampByte(contrast[i + 1] * scales[1]);
    balanced[i + 2] = clampByte(contrast[i + 2] * scales[2]);
  }

  // 4) Light Gaussian blur (texture-preserving denoising, matches training step 5)
  const blurred = blurRgb(balanced, width, height);

  // No per-channel z-score normalization – training images are standard [0, 255].
  return {
    rgb: Uint8Array.from(blurred, (v) => clampByte(v) | 0),
    roi
  };
}

function applyFastPreprocessing(rgbBytes: Uint8Array, width: number, height: number): PreprocessingResult {
  // Lightweight path: the capture screen already crops to the nail region,
  // so we only need ROI masking here.  Per-channel z-score normalization is
  // intentionally omitted – training images are standard [0, 255].
  const base = Float32Array.from(rgbBytes, (v) => v);
  const { rgb: roiFocused, roi } = extractRoiBySkinMask(base, width, height);
  return {
    rgb: Uint8Array.from(roiFocused, (v) => clampByte(v) | 0),
    roi
  };
}

function getCenterCrop(width: number, height: number, marginRatio = 0.1) {
  const marginX = Math.round(width * marginRatio);
  const marginY = Math.round(height * marginRatio);
  const cropX = Math.max(0, marginX);
  const cropY = Math.max(0, marginY);
  const cropWidth = Math.max(1, width - marginX * 2);
  const cropHeight = Math.max(1, height - marginY * 2);
  return { originX: cropX, originY: cropY, width: cropWidth, height: cropHeight };
}

let lastInferenceLatencyMs = 0;

function isLikelyLowEndDevice(): boolean {
  // If the last inference was significantly slow (> 800ms for a single model run),
  // we treat the device as low-end to prioritize responsiveness.
  if (lastInferenceLatencyMs > 800) {
    return true;
  }
  return false;
}

function getActiveEnsembleModels(): TfliteModelSpec[] {
  const sorted = [...TFLITE_ENSEMBLE_MODELS].sort((a, b) => b.weight - a.weight);
  if (sorted.length <= 1) {
    return sorted;
  }

  const floatPreferred = sorted.find((model) => model.nativeInputType === 'float32') ?? sorted[0];
  const int8Preferred =
    sorted.find((model) => model.nativeInputType === 'int8' || model.nativeInputType === 'uint8') ?? sorted[0];
  if (!ENSEMBLING_ENABLED || singleModelMode || isLikelyLowEndDevice()) {
    return [floatPreferred ?? int8Preferred];
  }

  return sorted;
}

export function getTfliteRuntimeMode(): TfliteRuntimeMode {
  return runtimeMode;
}

function calibrateProbabilities(values: number[], temperature = 1): number[] {
  const sanitized = values.map((v) => Math.max(0, Number(v) || 0));
  if (temperature <= 0 || temperature === 1) {
    const sum = sanitized.reduce((acc, cur) => acc + cur, 0);
    return sum > 0 ? sanitized.map((v) => v / sum) : sanitized;
  }

  const scaled = sanitized.map((p) => Math.pow(Math.max(p, 1e-8), 1 / temperature));
  const scaledSum = scaled.reduce((acc, cur) => acc + cur, 0);
  return scaledSum > 0 ? scaled.map((v) => v / scaledSum) : scaled;
}

function mapToPrediction(
  values: number[],
  options: { 
    temperature?: number; 
    inferenceTimeMs: number; 
    quality: InferenceQualityMetadata;
    roi?: { x: number; y: number; width: number; height: number };
  }
): TflitePrediction {
  if (options.quality.brightness < 0.1) {
    return {
      label: 'unidentified',
      confidence: 0,
      index: -1,
      runtimeMode,
      inferenceTimeMs: Math.max(0, Math.round(options.inferenceTimeMs)),
      rawProbabilities: values,
      qualityScore: 0,
      qualityFlags: ['too_dark'],
      roi: options.roi,
    };
  }

  const probs = calibrateProbabilities(values, options.temperature ?? 1);
  const rawAlmProb = ALM_INDEX >= 0 && ALM_INDEX < probs.length ? probs[ALM_INDEX] ?? 0 : 0;
  const adjustedProbs = [...probs];
  const darkPigmentScore = options.quality.darkPigmentScore ?? 0;
  const darkCenterRatio = options.quality.darkCenterRatio ?? darkPigmentScore;
  const framingScore = options.quality.framingScore ?? 1;
  const dominantRegionRatio = options.quality.dominantRegionRatio ?? 1;
  const componentCount = options.quality.componentCount ?? 1;
  const poorFraming = framingScore < 0.42 || dominantRegionRatio < 0.14 || componentCount >= 3;

  if (ALM_INDEX >= 0 && ALM_INDEX < adjustedProbs.length) {
    adjustedProbs[ALM_INDEX] *= 0.76;
  }
  if (HEALTHY_INDEX >= 0 && HEALTHY_INDEX < adjustedProbs.length) {
    const healthyFactor = options.quality.qualityScore < 0.64 ? 0.8 : 0.86;
    adjustedProbs[HEALTHY_INDEX] *= healthyFactor;
  }
  if (CLUBBING_INDEX >= 0 && CLUBBING_INDEX < adjustedProbs.length) {
    adjustedProbs[CLUBBING_INDEX] *= 1.1;
  }
  if (ONYCHOGRYPHOSIS_INDEX >= 0 && ONYCHOGRYPHOSIS_INDEX < adjustedProbs.length) {
    adjustedProbs[ONYCHOGRYPHOSIS_INDEX] *= 1.16;
  }

  const preGuardHealthy = HEALTHY_INDEX >= 0 ? adjustedProbs[HEALTHY_INDEX] ?? 0 : 0;
  const preGuardAlm = ALM_INDEX >= 0 ? adjustedProbs[ALM_INDEX] ?? 0 : 0;
  const preGuardOnycho = ONYCHOGRYPHOSIS_INDEX >= 0 ? adjustedProbs[ONYCHOGRYPHOSIS_INDEX] ?? 0 : 0;

  // Guardrail: when healthy dominates but ALM evidence is still non-trivial,
  // down-weight healthy to avoid masking potentially dangerous pigmented lesions.
  if (preGuardHealthy > 0.9 && preGuardAlm > 0.03 && darkPigmentScore > 0.08 && darkCenterRatio > 0.07) {
    if (HEALTHY_INDEX >= 0 && HEALTHY_INDEX < adjustedProbs.length) {
      adjustedProbs[HEALTHY_INDEX] *= 0.42;
    }
    if (ALM_INDEX >= 0 && ALM_INDEX < adjustedProbs.length) {
      adjustedProbs[ALM_INDEX] *= 1.75;
    }
    if (ONYCHOGRYPHOSIS_INDEX >= 0 && ONYCHOGRYPHOSIS_INDEX < adjustedProbs.length) {
      adjustedProbs[ONYCHOGRYPHOSIS_INDEX] *= 1.22;
    }
  }

  // Secondary guard for thickened/dystrophic nails being absorbed by healthy.
  if (preGuardHealthy > 0.82 && preGuardOnycho > 0.04) {
    if (HEALTHY_INDEX >= 0 && HEALTHY_INDEX < adjustedProbs.length) {
      adjustedProbs[HEALTHY_INDEX] *= 0.55;
    }
    if (ONYCHOGRYPHOSIS_INDEX >= 0 && ONYCHOGRYPHOSIS_INDEX < adjustedProbs.length) {
      adjustedProbs[ONYCHOGRYPHOSIS_INDEX] *= 1.9;
    }
  }

  if (darkPigmentScore > 0.11 && darkCenterRatio > 0.08) {
    if (HEALTHY_INDEX >= 0 && HEALTHY_INDEX < adjustedProbs.length) {
      adjustedProbs[HEALTHY_INDEX] *= 0.62;
    }
    if (ALM_INDEX >= 0 && ALM_INDEX < adjustedProbs.length) {
      adjustedProbs[ALM_INDEX] *= 1.32;
    }
  }

  if (darkPigmentScore > 0.2 && darkCenterRatio > 0.14) {
    if (HEALTHY_INDEX >= 0 && HEALTHY_INDEX < adjustedProbs.length) {
      adjustedProbs[HEALTHY_INDEX] *= 0.48;
    }
    if (ALM_INDEX >= 0 && ALM_INDEX < adjustedProbs.length) {
      adjustedProbs[ALM_INDEX] *= 1.4;
    }
  }

  const adjustedSum = adjustedProbs.reduce((acc, cur) => acc + Math.max(0, cur), 0);
  const finalProbs = adjustedSum > 0
    ? adjustedProbs.map((v) => Math.max(0, v) / adjustedSum)
    : probs;

  let maxIdx = 0;
  let maxVal = finalProbs[0] ?? 0;

  for (let i = 1; i < finalProbs.length; i++) {
    if (finalProbs[i] > maxVal) {
      maxVal = finalProbs[i];
      maxIdx = i;
    }
  }

  let secondVal = 0;
  for (let i = 0; i < finalProbs.length; i++) {
    if (i === maxIdx) continue;
    if (finalProbs[i] > secondVal) {
      secondVal = finalProbs[i];
    }
  }

  const margin = Math.max(0, maxVal - secondVal);
  const candidateLabel = CLASS_LABELS[maxIdx] ?? 'unidentified';
  const isVeryStrongAlmByModel =
    candidateLabel === 'Acral Lentiginous Melanoma' &&
    maxVal >= 0.9 &&
    margin >= 0.7 &&
    rawAlmProb >= 0.88;
  const qualityFactor = 0.78 + 0.22 * options.quality.qualityScore;
  const adaptiveConfidence = maxVal * qualityFactor;
  const confidence = Math.max(0, Math.min(1, Number(adaptiveConfidence.toFixed(4))));

  let minConfidenceForLabel = LOW_CONFIDENCE_UNIDENTIFIED_THRESHOLD + (1 - options.quality.qualityScore) * 0.11;
  if (candidateLabel === 'Acral Lentiginous Melanoma') {
    // High-risk label requires stronger evidence to reduce harmful false positives.
    minConfidenceForLabel = Math.max(minConfidenceForLabel, 0.72);
    if (options.quality.qualityScore < 0.58) {
      minConfidenceForLabel += 0.07;
    }
    if (margin < 0.12) {
      minConfidenceForLabel += 0.1;
    }
    if (!isVeryStrongAlmByModel && (darkPigmentScore < 0.11 || darkCenterRatio < 0.09)) {
      minConfidenceForLabel += 0.1;
    }
    if (isVeryStrongAlmByModel) {
      // Preserve true positives when the model itself is overwhelmingly confident.
      minConfidenceForLabel = Math.min(minConfidenceForLabel, 0.68);
    }
    if (poorFraming && !isVeryStrongAlmByModel) {
      minConfidenceForLabel += 0.14;
    }
  }

  if (candidateLabel === 'clubbing' || candidateLabel === 'onychogryphosis') {
    minConfidenceForLabel = Math.max(0.38, minConfidenceForLabel - 0.06);
  }

  if (candidateLabel === 'healthy' && margin < 0.045 && options.quality.qualityScore < 0.62) {
    minConfidenceForLabel += 0.05;
  }

  if (candidateLabel === 'healthy' && darkPigmentScore > 0.1) {
    minConfidenceForLabel += 0.24;
  }

  if (poorFraming) {
    minConfidenceForLabel += 0.1;
  }

  let mappedLabel: DiagnosisLabel = confidence < minConfidenceForLabel
    ? 'unidentified'
    : candidateLabel;

  if (mappedLabel === 'Acral Lentiginous Melanoma') {
    const healthyProb = HEALTHY_INDEX >= 0 ? finalProbs[HEALTHY_INDEX] ?? 0 : 0;
    const strongAlmEvidence =
      darkPigmentScore >= 0.12 &&
      darkCenterRatio >= 0.1 &&
      margin >= 0.12 &&
      options.quality.qualityScore >= 0.58;

    if (!strongAlmEvidence && !isVeryStrongAlmByModel) {
      mappedLabel = healthyProb >= 0.24 && darkPigmentScore < 0.12 ? 'healthy' : 'unidentified';
    }
  }

  if (mappedLabel === 'unidentified' && isVeryStrongAlmByModel && confidence >= 0.68) {
    mappedLabel = 'Acral Lentiginous Melanoma';
  }

  if (mappedLabel !== 'unidentified' && poorFraming && confidence < 0.84 && !isVeryStrongAlmByModel) {
    mappedLabel = 'unidentified';
  }

  const mappedIndex = mappedLabel === 'unidentified' ? -1 : CLASS_LABELS.indexOf(mappedLabel);
  // Enforce user requirement: if the computed confidence is below 50%,
  // report as 'unidentified' to keep downstream behavior consistent.
  if (confidence < 0.5) {
    mappedLabel = 'unidentified';
  }

  return {
    label: mappedLabel,
    confidence,
    index: mappedIndex,
    runtimeMode,
    inferenceTimeMs: Math.max(0, Math.round(options.inferenceTimeMs)),
    rawProbabilities: finalProbs,
    qualityScore: Number(options.quality.qualityScore.toFixed(4)),
    qualityFlags: options.quality.qualityFlags,
    roi: options.roi,
  };
}

async function preprocessNativeImageToRgb(
  imageUri: string
): Promise<{ rgbInput: Uint8Array; quality: InferenceQualityMetadata; roi?: { x: number; y: number; width: number; height: number } }> {
  const modelInputSize = getModelInputSize();
  const nativePreprocessor = getNativePreprocessorModule();
  if (Platform.OS === 'android' && nativePreprocessor) {
    try {
      const result = await nativePreprocessor.preprocessImage(imageUri);
      if (result?.available && result?.usedFullPipeline && result.rgbBase64) {
        const decoded = toByteArray(result.rgbBase64);
        if (decoded.length === modelInputSize * modelInputSize * 3) {
          const rgb = Uint8Array.from(decoded);
          return {
            rgbInput: rgb,
            quality: computeImageQualityMetadata(rgb, modelInputSize, modelInputSize),
            roi: undefined, // Native preprocessor doesn't return ROI yet
          };
        }
      }
    } catch {
      // Fall through to JS preprocessing pipeline.
    }
  }

  // If the image is already at model input size (e.g. capture screen pre-resized it),
  // skip the redundant resize + JPEG recompression that would only degrade quality.
  let decodedWidth: number;
  let decodedHeight: number;
  let rgb: Uint8Array;

  const isDataUri = imageUri.startsWith('data:');
  const needsResize = async () => {
    const resized = await manipulateAsync(
      imageUri,
      [{ resize: { width: modelInputSize, height: modelInputSize } }],
      { compress: 0.92, format: SaveFormat.JPEG }
    );
    const b64 = await FileSystem.readAsStringAsync(resized.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return jpeg.decode(toByteArray(b64), { useTArray: true });
  };

  const readDirect = async () => {
    if (isDataUri) {
      const commaIndex = imageUri.indexOf(',');
      if (commaIndex === -1) {
        throw new Error('Invalid data URI');
      }
      const base64Payload = imageUri.slice(commaIndex + 1);
      return jpeg.decode(toByteArray(base64Payload), { useTArray: true });
    }
    const b64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return jpeg.decode(toByteArray(b64), { useTArray: true });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let decoded: { width: number; height: number; data: Uint8Array | any };
  let originalWidth = 0;
  let originalHeight = 0;

  try {
    await new Promise((resolve) => {
      Image.getSize(imageUri, (width, height) => {
        originalWidth = width;
        originalHeight = height;
        resolve(null);
      }, () => resolve(null));
    });
  } catch {
    // Fallback if needed, but usually we can get size.
  }

  const normalizedUri = isDataUri ? imageUri : imageUri.split('?')[0];
  const isJpegUri = isDataUri ? /^data:image\/jpe?g/i.test(normalizedUri) : /\.(jpe?g)$/i.test(normalizedUri);
  const hasDimensions = originalWidth > 0 && originalHeight > 0;
  const pixelCount = hasDimensions ? originalWidth * originalHeight : 0;
  const shouldResizeFirst =
    !isJpegUri ||
    (!isDataUri && !hasDimensions) ||
    (!isDataUri && pixelCount > MAX_DIRECT_DECODE_PIXELS);

  if (shouldResizeFirst) {
    decoded = await needsResize();
  } else {
    try {
      // Try reading directly first – avoids an extra encode/decode cycle.
      decoded = await readDirect();
      if (!isDataUri && (decoded.width !== modelInputSize || decoded.height !== modelInputSize)) {
        decoded = await needsResize();
      }
    } catch {
      decoded = await needsResize();
    }
  }

  if (originalWidth === 0) {
    originalWidth = decoded.width;
    originalHeight = decoded.height;
  }

  decodedWidth = decoded.width;
  decodedHeight = decoded.height;
  rgb = new Uint8Array(decodedWidth * decodedHeight * 3);

  for (let i = 0, j = 0; i < decoded.data.length; i += 4, j += 3) {
    rgb[j] = decoded.data[i];
    rgb[j + 1] = decoded.data[i + 1];
    rgb[j + 2] = decoded.data[i + 2];
  }

  const { rgb: processed, roi } = isLikelyLowEndDevice()
    ? applyFastPreprocessing(rgb, decodedWidth, decodedHeight)
    : applySevenStepPreprocessing(rgb, decodedWidth, decodedHeight);

  // Scale ROI back to original image dimensions
  const finalRoi = roi ? {
    x: roi.x * (originalWidth / decodedWidth),
    y: roi.y * (originalHeight / decodedHeight),
    width: roi.width * (originalWidth / decodedWidth),
    height: roi.height * (originalHeight / decodedHeight),
  } : undefined;

  if (decodedWidth === modelInputSize && decodedHeight === modelInputSize) {
    // Quality should be computed on the final image that the model consumes
    // so comparisons between models are consistent.
    return {
      rgbInput: processed,
      quality: computeImageQualityMetadata(processed, modelInputSize, modelInputSize),
      roi: finalRoi
    };
  }

  const resizedRgb = resizeRgbBilinear(
    Float32Array.from(processed, (v) => v),
    decodedWidth,
    decodedHeight,
    modelInputSize,
    modelInputSize
  );

  const finalRgb = Uint8Array.from(resizedRgb, (v) => clampByte(v) | 0);
  // Compute quality on the model-sized RGB so quality metrics match the
  // actual input used for inference across model variants.
  return {
    rgbInput: finalRgb,
    quality: computeImageQualityMetadata(finalRgb, modelInputSize, modelInputSize),
    roi: finalRoi
  };
}

function normalizeOutputValues(rawValues: number[]): number[] {
  const values = rawValues.map((value) => Number(value) || 0);
  const finite = values.filter((v) => Number.isFinite(v));

  if (finite.length === 0) {
    return values;
  }

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const sum = finite.reduce((acc, cur) => acc + cur, 0);
  const approxProbabilities = min >= 0 && max <= 1.05 && sum > 0.9 && sum < 1.1;
  if (approxProbabilities) {
    return values;
  }

  const allNonNegative = min >= 0;
  if (allNonNegative && sum > 0) {
    return values.map((v) => v / sum);
  }

  const shifted = values.map((v) => v - max);
  const expValues = shifted.map((v) => Math.exp(v));
  const expSum = expValues.reduce((acc, cur) => acc + cur, 0);
  return expSum > 0 ? expValues.map((v) => v / expSum) : values;
}

function coerceNumericArray(values: unknown): number[] | null {
  if (!values || typeof values !== 'object') {
    return null;
  }

  const maybeArrayLike = values as ArrayLike<unknown>;
  const length = Number(maybeArrayLike.length);
  if (!Number.isFinite(length) || length <= 0) {
    return null;
  }

  return Array.from({ length }, (_, i) => Number(maybeArrayLike[i]) || 0);
}

function extractModelOutputValues(rawOutputs: unknown): number[] | null {
  if (!rawOutputs) {
    return null;
  }

  const pickBestTensor = (candidates: number[][]): number[] | null => {
    if (candidates.length === 0) {
      return null;
    }

    const classCount = CLASS_LABELS.length;
    const classLike = candidates
      .filter((tensor) => tensor.length >= classCount)
      .sort((a, b) => a.length - b.length);
    if (classLike.length > 0) {
      return classLike[0];
    }

    return candidates.sort((a, b) => b.length - a.length)[0];
  };

  // Common case: run() returns [TypedArray] for a single-output model.
  if (Array.isArray(rawOutputs)) {
    if (rawOutputs.length === 0) {
      return null;
    }

    const tensorCandidates = rawOutputs
      .map((value) => coerceNumericArray(value))
      .filter((value): value is number[] => !!value && value.length > 0);
    const bestTensor = pickBestTensor(tensorCandidates);
    if (bestTensor) {
      return bestTensor;
    }

    const flatArray = coerceNumericArray(rawOutputs);
    if (flatArray && flatArray.length > 0) {
      return flatArray;
    }
  }

  // Some builds can return a direct TypedArray for single output.
  const direct = coerceNumericArray(rawOutputs);
  if (direct && direct.length > 0) {
    return direct;
  }

  // Defensive: support object-map outputs by taking the first tensor-like value.
  if (typeof rawOutputs === 'object') {
    const mappedValues = Object.values(rawOutputs as Record<string, unknown>)
      .map((value) => coerceNumericArray(value))
      .filter((value): value is number[] => !!value && value.length > 0);
    const bestTensor = pickBestTensor(mappedValues);
    if (bestTensor) {
      return bestTensor;
    }
  }

  return null;
}

function toNativeInput(
  rgbInput: Uint8Array,
  inputType: TfliteModelInputType,
  quantization?: TfliteModelSpec['quantization']
): Uint8Array | Int8Array | Float32Array {
  if (inputType === 'float32') {
    // Training/export path expects raw RGB range [0, 255] for float input.
    return Float32Array.from(rgbInput, (value) => value);
  }

  if (inputType === 'int8') {
    const scale = quantization?.scale ?? 1;
    const zeroPoint = quantization?.zeroPoint ?? 0;
    const out = new Int8Array(rgbInput.length);
    for (let i = 0; i < rgbInput.length; i++) {
      const quantized = Math.round(rgbInput[i] / scale + zeroPoint);
      out[i] = Math.max(-128, Math.min(127, quantized));
    }
    return out;
  }

  return rgbInput;
}

function aggregateEnsembleProbabilities(results: Array<{ probabilities: number[]; weight: number }>): number[] {
  if (results.length === 0) {
    throw new Error('No model outputs available for ensembling');
  }

  const classCount = CLASS_LABELS.length;
  const accumulator = new Array<number>(classCount).fill(0);
  let totalWeight = 0;

  for (const result of results) {
    const normalizedWeight = Number.isFinite(result.weight) && result.weight > 0 ? result.weight : 1;
    for (let i = 0; i < classCount; i++) {
      accumulator[i] += (result.probabilities[i] ?? 0) * normalizedWeight;
    }
    totalWeight += normalizedWeight;
  }

  const averaged = totalWeight > 0 ? accumulator.map((value) => value / totalWeight) : accumulator;
  return normalizeOutputValues(averaged);
}

async function getNativeModel(modelSpec: TfliteModelSpec): Promise<NativeTensorflowModel> {
  if (!hasNativeTfliteTurboModule()) {
    throw new Error('Native Tflite TurboModule is unavailable in this binary');
  }

  if (!nativeLoadTensorflowModel) {
    const nativeModule = await import('react-native-fast-tflite');
    nativeLoadTensorflowModel = nativeModule.loadTensorflowModel;
  }

  const loadModel = nativeLoadTensorflowModel;
  if (!loadModel) {
    throw new Error('Failed to initialize native TFLite loader');
  }

  if (nativeModels[modelSpec.id]) {
    runtimeMode = 'native-tflite';
    return nativeModels[modelSpec.id];
  }

  if (!nativeModelPromises[modelSpec.id]) {
    nativeModelPromises[modelSpec.id] = loadModel(modelSpec.nativeSource, 'nnapi')
      .catch(() => loadModel(modelSpec.nativeSource, 'default'))
      .then((model) => {
        nativeModels[modelSpec.id] = model;
        runtimeMode = 'native-tflite';
        return model;
      })
      .catch((error) => {
        delete nativeModelPromises[modelSpec.id];
        runtimeMode = 'native-fallback';
        throw error;
      });
  }

  return nativeModelPromises[modelSpec.id];
}

export async function preloadTfliteModel(): Promise<void> {
  if (Platform.OS === 'web') {
    runtimeMode = 'native-fallback';
    throw new Error('Web inference is disabled for this native-only build.');
  }

  if (!hasNativeTfliteTurboModule()) {
    runtimeMode = 'native-fallback';
    throw new Error(NATIVE_RUNTIME_UNAVAILABLE_MESSAGE);
  }

  const activeModels = getActiveEnsembleModels();
  const settled = await Promise.allSettled(activeModels.map((modelSpec) => getNativeModel(modelSpec)));
  const loadedCount = settled.filter((result) => result.status === 'fulfilled').length;
  if (loadedCount === 0) {
    runtimeMode = 'native-fallback';
    throw new Error('Failed to preload native ensemble models');
  }

  // Warmup loaded models to compile NNAPI/delegate kernels and remove first-run jitter.
  const modelInputSize = getModelInputSize();
  const warmupSettled = await Promise.allSettled(
    activeModels.map(async (modelSpec) => {
      const model = nativeModels[modelSpec.id];
      if (model) {
        await warmupModel(model, modelInputSize);
      }
    })
  );
  const warmupCount = warmupSettled.filter((result) => result.status === 'fulfilled').length;
  isWarmedUp = warmupCount > 0;
}

export async function runTfliteInference(imageUri: string): Promise<TflitePrediction> {
  if (!imageUri) {
    throw new Error('imageUri is required for inference');
  }

  if (Platform.OS === 'web') {
    runtimeMode = 'native-fallback';
    throw new Error('Web inference is disabled for this native-only build.');
  }

  const startedAt = Date.now();
  const { rgbInput, quality, roi } = await preprocessNativeImageToRgb(imageUri);

  if (!hasNativeTfliteTurboModule()) {
    runtimeMode = 'native-fallback';
    throw new Error(NATIVE_RUNTIME_UNAVAILABLE_MESSAGE);
  }

  try {
    // Single-model inference (ensembling disabled).
    // For future use, ensemble code is kept below in comments.
    const activeModels = getActiveEnsembleModels();
    if (activeModels.length === 0) {
      throw new Error('No active models configured for inference');
    }

    if (activeModels.length === 1) {
      // Optimized path for single model
      const modelSpec = activeModels[0];
      try {
        const model = await getNativeModel(modelSpec);
        const nativeInput = toNativeInput(rgbInput, modelSpec.nativeInputType, modelSpec.quantization);
        const outputs = await model.run([nativeInput]);
        const outputValues = extractModelOutputValues(outputs);
        if (!outputValues || outputValues.length === 0) {
          throw new Error(`${modelSpec.id}: empty output`);
        }
        const values = normalizeOutputValues(outputValues);
        runtimeMode = 'native-tflite';
        return mapToPrediction(values, {
          temperature: NATIVE_TEMPERATURE,
          inferenceTimeMs: Date.now() - startedAt,
          quality,
          roi,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown model error';
        throw new Error(`Single-model inference failed on ${modelSpec.id}: ${message}`);
      }
    }

    // Multi-model Ensembling path: Run all models in parallel to minimize bridge latency
    const modelTasks = activeModels.map(async (modelSpec) => {
      const modelTaskStartedAt = Date.now();
      try {
        const model = await getNativeModel(modelSpec);
        const nativeInput = toNativeInput(rgbInput, modelSpec.nativeInputType, modelSpec.quantization);
        const outputs = await model.run([nativeInput]);
        const outputValues = extractModelOutputValues(outputs);
        
        if (!outputValues || outputValues.length === 0) {
          return { error: `${modelSpec.id}: empty output` };
        }

        const latency = Date.now() - modelTaskStartedAt;
        // Track latency to optimize future runs on low-end hardware
        if (latency > lastInferenceLatencyMs) {
          lastInferenceLatencyMs = latency;
        }

        return {
          probabilities: normalizeOutputValues(outputValues),
          weight: modelSpec.weight,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown model error';
        return { error: `${modelSpec.id}: ${message}` };
      }
    });

    const taskResults = await Promise.all(modelTasks);
    const ensembleResults: Array<{ probabilities: number[]; weight: number }> = [];
    const modelErrors: string[] = [];

    for (const res of taskResults) {
      if ('error' in res) {
        modelErrors.push(res.error as string);
      } else {
        ensembleResults.push(res as { probabilities: number[]; weight: number });
      }
    }

    if (ensembleResults.length === 0) {
      throw new Error(`Ensemble inference failed. Errors: ${modelErrors.join('; ')}`);
    }

    const aggregatedValues = aggregateEnsembleProbabilities(ensembleResults);
    runtimeMode = 'native-tflite';
    return mapToPrediction(aggregatedValues, {
      temperature: NATIVE_TEMPERATURE,
      inferenceTimeMs: Date.now() - startedAt,
      quality,
      roi,
    });
  } catch (error) {
    runtimeMode = 'native-fallback';
    const message = error instanceof Error ? error.message : 'Unknown native inference error';
    throw new Error(`Native model inference failed: ${message}`);
  }
}
