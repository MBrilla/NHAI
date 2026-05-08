import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/nailscan/screen-shell';
import { ActionButton } from '@/components/nailscan/ui-kit';
import { getConditionInfo } from '@/data/diagnosis';
import { useNailScanColors } from '@/hooks/use-nailscan-colors';
import type { ScanHistoryEntry } from '@/services/scan-history';
import { deleteScanHistoryEntry, getScanHistoryById } from '@/services/scan-history';

export default function HistoryDetailScreen() {
  const router = useRouter();
  const colors = useNailScanColors();
  const styles = makeStyles(colors);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [entry, setEntry] = useState<ScanHistoryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!id) {
      setLoading(false);
      setEntry(null);
      return;
    }

    getScanHistoryById(id)
      .then((item) => {
        if (active) {
          setEntry(item);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const condition = getConditionInfo(entry?.label ?? 'healthy');

  const formattedDate = entry
    ? new Date(entry.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : '-';

  const handleDelete = () => {
    if (!entry) {
      return;
    }

    Alert.alert('Delete Scan', 'Remove this scan from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteScanHistoryEntry(entry.id);
          router.replace('/(tabs)/history');
        },
      },
    ]);
  };

  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Saved Scan Detail</Text>

        {loading ? <Text style={styles.notice}>Loading scan details...</Text> : null}
        {!loading && !entry ? <Text style={styles.notice}>No scan was found for this entry.</Text> : null}

        {entry?.imageUri ? <Image source={{ uri: entry.imageUri }} style={styles.previewImage} resizeMode="cover" /> : null}

        <View style={styles.card}>
          <Text style={styles.rowLabel}>Date</Text>
          <Text style={styles.rowValue}>{formattedDate}</Text>

          <Text style={styles.rowLabel}>Prediction</Text>
          <Text style={styles.rowValue}>{entry?.label ?? '-'}</Text>

          <Text style={styles.rowLabel}>Confidence</Text>
          <Text style={styles.rowValue}>{entry ? `${Math.round(entry.confidence * 100)}%` : '-'}</Text>

          <Text style={styles.rowLabel}>Risk level</Text>
          <Text style={styles.rowValue}>{condition.riskLevel}</Text>

          <Text style={styles.rowLabel}>Description</Text>
          <Text style={styles.description}>{condition.description}</Text>
        </View>

        <ActionButton label="Back to History" onPress={() => router.replace('/(tabs)/history')} />
        {entry ? <ActionButton label="Delete This Scan" variant="secondary" onPress={handleDelete} /> : null}
      </ScrollView>
    </ScreenShell>
  );
}

const makeStyles = (colors: ReturnType<typeof useNailScanColors>) => StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
    marginBottom: 14,
  },
  previewImage: {
    width: '100%',
    height: 176,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
  },
  rowLabel: {
    marginTop: 8,
    fontSize: 12,
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowValue: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 21,
    color: colors.mutedText,
  },
  notice: {
    marginBottom: 10,
    fontSize: 13,
    color: colors.mutedText,
  },
});
