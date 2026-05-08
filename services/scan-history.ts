import AsyncStorage from '@react-native-async-storage/async-storage';

import { isDiagnosisLabel, type DiagnosisLabel } from '@/data/diagnosis';
import type { TfliteRuntimeMode } from '@/services/tflite-inference';

const HISTORY_KEY = 'nailscan_history_v1';

export interface ScanHistoryEntry {
  id: string;
  label: DiagnosisLabel;
  confidence: number;
  timestamp: number;
  imageUri?: string;
  runtimeMode?: TfliteRuntimeMode;
  inferenceTimeMs?: number;
}

function sanitizeHistory(entries: ScanHistoryEntry[]): ScanHistoryEntry[] {
  const safeEntries = entries
    .map((entry) => {
      const safeLabel = isDiagnosisLabel(String(entry?.label ?? '')) ? entry.label : 'unidentified';
      const safeConfidence = Math.max(0, Math.min(1, Number(entry?.confidence ?? 0)));
      const safeRuntimeMode = entry?.runtimeMode === 'native-tflite' || entry?.runtimeMode === 'native-fallback'
        ? entry.runtimeMode
        : undefined;
      const safeImageUri = typeof entry?.imageUri === 'string' && entry.imageUri.trim().length > 0
        ? entry.imageUri
        : undefined;
      const safeInferenceTimeMs = Number.isFinite(Number(entry?.inferenceTimeMs))
        ? Number(entry.inferenceTimeMs)
        : undefined;

      return {
        id: String(entry?.id ?? ''),
        label: safeLabel,
        confidence: safeConfidence,
        timestamp: Number(entry?.timestamp ?? 0),
        imageUri: safeImageUri,
        runtimeMode: safeRuntimeMode,
        inferenceTimeMs: safeInferenceTimeMs,
      } satisfies ScanHistoryEntry;
    })
    .filter((entry) => entry.id.length > 0 && Number.isFinite(entry.timestamp) && entry.timestamp > 0);

  return safeEntries
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function getScanHistory(): Promise<ScanHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return sanitizeHistory(parsed as ScanHistoryEntry[]);
  } catch {
    return [];
  }
}

export async function getScanHistoryById(id: string): Promise<ScanHistoryEntry | null> {
  const items = await getScanHistory();
  return items.find((item) => item.id === id) ?? null;
}

export async function addScanHistoryEntry(entry: Omit<ScanHistoryEntry, 'id' | 'timestamp'>): Promise<ScanHistoryEntry> {
  const created: ScanHistoryEntry = {
    ...entry,
    id: `scan-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp: Date.now(),
    confidence: Math.max(0, Math.min(1, Number(entry.confidence || 0))),
  };

  const current = await getScanHistory();
  const next = [created, ...current];
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return created;
}

export async function deleteScanHistoryEntry(id: string): Promise<void> {
  const current = await getScanHistory();
  const next = current.filter((item) => item.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export async function clearScanHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
