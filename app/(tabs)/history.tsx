import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/nailscan/screen-shell';
import { GlassView } from '@/components/nailscan/glass-view';
import { useNailScanColors } from '@/hooks/use-nailscan-colors';
import type { ScanHistoryEntry } from '@/services/scan-history';
import { clearScanHistory, getScanHistory } from '@/services/scan-history';

export default function HistoryScreen() {
  const router = useRouter();
  const colors = useNailScanColors();
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(() => {
    let active = true;
    setLoading(true);
    getScanHistory()
      .then((items) => {
        if (active) {
          setHistory(items);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return loadHistory();
    }, [loadHistory])
  );

  const formatHistoryDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const handleClearHistory = () => {
    Alert.alert('Clear All History', 'This will permanently remove all saved scans. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await clearScanHistory();
          setHistory([]);
        },
      },
    ]);
  };

  return (
    <ScreenShell variant="default">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/')} style={styles.headerIconBtn}>
            <Ionicons name="chevron-back" size={20} color="#0B2E6F" />
          </Pressable>
          <Text style={styles.headerTitle}>Scan History</Text>
          <Pressable 
            onPress={handleClearHistory} 
            disabled={history.length === 0}
            style={styles.headerIconBtn}
          >
            <Ionicons 
              name="trash-outline" 
              size={20} 
              color={history.length === 0 ? '#B8C7E0' : '#FF6B6B'} 
            />
          </Pressable>
        </View>
        <Text style={styles.headerSubtitle}>View your past nail scan results</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {history.length > 0 && (
            <>
              {/* Auto Save Card */}
              <GlassView style={styles.autoSaveCard} intensity={86}>
                <View style={styles.autoSaveIconBox}>
                  <Ionicons name="checkmark-circle" size={30} color="white" />
                </View>
                <View style={styles.autoSaveTextBox}>
                  <Text style={styles.autoSaveTitle}>Results are automatically saved</Text>
                  <Text style={styles.autoSaveText}>
                    All your scan results are securely stored and can be viewed anytime.
                  </Text>
                </View>
              </GlassView>

              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Recent Scans</Text>
                <Text style={styles.sectionCount}>
                  {history.length} {history.length === 1 ? 'result' : 'results'}
                </Text>
              </View>
            </>
          )}

          {loading ? (
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyBox}>
              <GlassView style={styles.emptyCard} intensity={86}>
                <View style={styles.emptyIconBox}>
                  <Ionicons name="time" size={46} color="#006DFF" />
                </View>
                <Text style={styles.emptyTitle}>No History Yet</Text>
                <Text style={styles.emptyText}>
                  Your scan results will appear here after your first analysis.
                </Text>
              </GlassView>
            </View>
          ) : (
            history.map((entry) => (
              <HistoryCard 
                key={entry.id} 
                entry={entry} 
                formattedDate={formatHistoryDate(entry.timestamp)}
                onPress={() => {
                  router.push({
                    pathname: '/result',
                    params: {
                      label: entry.label,
                      confidence: `${entry.confidence}`,
                      imageUri: entry.imageUri || '',
                    },
                  });
                }}
              />
            ))
          )}
        </ScrollView>
      </View>
    </ScreenShell>
  );
}

function HistoryCard({ entry, formattedDate, onPress }: { entry: ScanHistoryEntry, formattedDate: string, onPress: () => void }) {
  const confidencePct = Math.round(entry.confidence * 100);
  const isHealthy = entry.label.toLowerCase().includes('healthy');
  const isUnidentified = entry.label.toLowerCase().includes('unidentified');
  
  let riskColor = '#FF8A00'; // Moderate
  let riskLabel = 'Moderate Risk';
  let statusColor = '#D71920';

  if (isHealthy) {
    riskColor = '#2E9D45';
    riskLabel = 'Low Risk';
    statusColor = '#2E9D45';
  } else if (isUnidentified) {
    riskColor = '#7E8BA0';
    riskLabel = 'Uncertain Risk';
    statusColor = '#7E8BA0';
  }

  return (
    <Pressable onPress={onPress}>
      <GlassView style={styles.historyCard} intensity={86}>
        <View style={styles.cardContent}>
          <View style={styles.thumbnailBox}>
            {entry.imageUri ? (
              <Image source={{ uri: entry.imageUri }} style={styles.thumbnail} />
            ) : (
              <Ionicons name="finger-print" size={34} color={statusColor} />
            )}
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{entry.label}</Text>
            <View style={styles.infoLine}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#006DFF" />
              <Text style={[styles.infoLineText, { color: '#006DFF' }]}>{confidencePct}% Confidence</Text>
            </View>
            <View style={styles.infoLine}>
              <Ionicons name="calendar-outline" size={16} color="#4F668F" />
              <Text style={[styles.infoLineText, { color: '#4F668F' }]}>{formattedDate}</Text>
            </View>
            <View style={[styles.riskPill, { backgroundColor: `${riskColor}20` }]}>
              <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
              <Text style={[styles.riskLabel, { color: riskColor }]}>{riskLabel}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#006DFF" />
        </View>
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 0,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0B2E6F',
    letterSpacing: -0.6,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4667A0',
    marginLeft: 52,
    marginTop: -4,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
    gap: 14,
  },
  autoSaveCard: {
    flexDirection: 'row',
    padding: 18,
    alignItems: 'center',
  },
  autoSaveIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#006DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoSaveTextBox: {
    flex: 1,
    marginLeft: 14,
  },
  autoSaveTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#006DFF',
  },
  autoSaveText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#071F55',
    marginTop: 5,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#071F55',
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#17448A',
  },
  historyCard: {
    padding: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailBox: {
    width: 86,
    height: 96,
    borderRadius: 15,
    backgroundColor: '#E9F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#071F55',
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  infoLineText: {
    fontSize: 12.5,
    fontWeight: '800',
    marginLeft: 6,
  },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  riskDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  riskLabel: {
    fontSize: 11.5,
    fontWeight: '900',
    marginLeft: 6,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#071F55',
    fontWeight: '700',
  },
  emptyBox: {
    paddingHorizontal: 2,
  },
  emptyCard: {
    padding: 26,
    alignItems: 'center',
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 109, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#071F55',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#4F668F',
    textAlign: 'center',
    marginTop: 10,
  },
});
