# Computer Vision Implementation Backup

This file contains the code for the Computer Vision (CV) pre-checks, including blur detection, nail presence validation, and UI feedback.

## 1. Inference Service Enhancements (`services/tflite-inference.ts`)

### Metadata Interface

```typescript
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
  manicureScore: number;
  obstructionScore: number;
  nailPresenceScore: number;
  isBlurry: boolean;
  qualityScore: number;
  qualityFlags: string[];
}
```

### Laplacian Blur Detection

```typescript
function computeLaplacianVariance(rgb: Uint8Array, width: number, height: number): number {
  const total = width * height;
  const laplacian = new Float32Array(total);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const center = luma(rgb[idx * 3], rgb[idx * 3 + 1], rgb[idx * 3 + 2]);
      const up = luma(rgb[(idx - width) * 3], rgb[(idx - width) * 3 + 1], rgb[(idx - width) * 3 + 2]);
      const down = luma(rgb[(idx + width) * 3], rgb[(idx + width) * 3 + 1], rgb[(idx + width) * 3 + 2]);
      const left = luma(rgb[(idx - 1) * 3], rgb[(idx - 1) * 3 + 1], rgb[(idx - 1) * 3 + 2]);
      const right = luma(rgb[(idx + 1) * 3], rgb[(idx + 1) * 3 + 1], rgb[(idx + 1) * 3 + 2]);
      laplacian[idx] = up + down + left + right - 4 * center;
    }
  }
  let mean = 0;
  for (let i = 0; i < total; i++) mean += laplacian[i];
  mean /= total;
  let variance = 0;
  for (let i = 0; i < total; i++) {
    const diff = laplacian[i] - mean;
    variance += diff * diff;
  }
  return variance / total;
}
```

### Manicure Detection

```typescript
function computeManicureMetadata(rgb: Uint8Array, width: number, height: number): { manicureScore: number } {
  const centerMinX = Math.floor(width * 0.25);
  const centerMaxX = Math.ceil(width * 0.75);
  const centerMinY = Math.floor(height * 0.25);
  const centerMaxY = Math.ceil(height * 0.75);
  let highSatCount = 0;
  let nonNaturalHueCount = 0;
  let centerPixelCount = 0;
  for (let y = centerMinY; y < centerMaxY; y++) {
    for (let x = centerMinX; x < centerMaxX; x++) {
      const idx = (y * width + x) * 3;
      const { h, s } = rgbToHsv(rgb[idx], rgb[idx+1], rgb[idx+2]);
      centerPixelCount++;
      if (s > 140) highSatCount++;
      const isNaturalHue = (h >= 0 && h <= 35) || (h >= 330 && h <= 360);
      if (!isNaturalHue && s > 40) nonNaturalHueCount++;
    }
  }
  const satRatio = highSatCount / (centerPixelCount || 1);
  const hueRatio = nonNaturalHueCount / (centerPixelCount || 1);
  return { manicureScore: clamp01(satRatio * 0.6 + hueRatio * 0.8) };
}
```

### Quality Validation Logic

```typescript
// Inside computeImageQualityMetadata
const laplacianVariance = computeLaplacianVariance(rgb, width, height);
const isBlurry = laplacianVariance < 140;
const nailPresenceScore = clamp01(framing.dominantRegionRatio * 2 + (1 - obstructionScore) * 0.5);

// Flags
if (isBlurry) qualityFlags.push('Image looks blurry. Hold steady and focus on the nail plate.');
if (framing.dominantRegionRatio < 0.14) qualityFlags.push('No nail clearly detected. Move closer to the fingernail.');
if (manicure.manicureScore > 0.45) qualityFlags.push('Nail polish or artificial nail detected. This may reduce accuracy.');
```

### Early-Exit Guardrail

```typescript
// Inside mapToPrediction
const criticalFlags: string[] = [];
if (quality.brightness < 0.12) criticalFlags.push('too_dark');
if (quality.isBlurry) criticalFlags.push('too_blurry');
if (quality.nailPresenceScore < 0.15) criticalFlags.push('no_nail_detected');

if (criticalFlags.length > 0) {
  return { label: 'unidentified', confidence: 0, ... };
}
```

## 2. UI Components

### Result Screen Quality Card (`app/result.tsx`)

```tsx
{hasWarnings && (
  <View style={[styles.card, { borderColor: '#FF9500', backgroundColor: '#FFF9F2' }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <Ionicons name="alert-circle" size={22} color="#FF9500" />
      <Text style={[styles.cardTitle, { color: '#B06600', marginBottom: 0, marginLeft: 8 }]}>Scan Quality Notice</Text>
    </View>
    {qualityFlags.map((flag, i) => (
      <View key={i} style={styles.warningRow}>
        <Ionicons name="close-circle-outline" size={16} color="#FF9500" style={{ marginTop: 2 }} />
        <Text style={styles.warningText}>{flag}</Text>
      </View>
    ))}
  </View>
)}
```

### Capture Screen Tips (`app/capture.tsx`)

```tsx
<GlassView style={styles.tipsCard} intensity={62}>
  <View style={styles.tipsHeader}>
    <Ionicons name="sparkles" size={moderateScale(20)} color="#086BFF" />
    <Text style={styles.tipsTitle}>For better scan results:</Text>
  </View>
  <View style={styles.tipsRow}>
    <TipItem icon="contract" label={"Center\nthe nail"} />
    <TipItem icon="sunny" label={"Use even\nlighting"} />
    ...
  </View>
</GlassView>
```
