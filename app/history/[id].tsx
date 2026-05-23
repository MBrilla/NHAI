import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageBackground, SafeAreaView, StatusBar, Platform, StyleSheet, Text, View } from 'react-native';

import { ResultView } from '@/components/nailscan/result-view';
import { getScanHistoryById, type ScanHistoryEntry } from '@/services/scan-history';

export default function HistoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [entry, setEntry] = useState<ScanHistoryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!id) {
      setLoading(false);
      return;
    }
    getScanHistoryById(id)
      .then((item) => {
        if (active) setEntry(item);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  return (
    <ImageBackground 
      source={require('@/assets/images/background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0 }}>
        {loading ? (
          <View style={styles.center}>
            <Text style={styles.loadingText}>Loading scan details...</Text>
          </View>
        ) : !entry ? (
          <View style={styles.center}>
            <Text style={styles.loadingText}>No scan was found for this entry.</Text>
          </View>
        ) : (
          <ResultView 
            label={entry.label}
            confidence={entry.confidence}
            imageUri={entry.imageUri}
            originalImageUri={entry.originalImageUri}
            roi={entry.roi}
            timestamp={entry.timestamp}
            isHistory={true}
            onBack={() => router.back()}
            onScanAgain={() => router.push('/capture')}
            onDone={() => router.replace('/(tabs)')}
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2FF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#3F5F8F',
    fontWeight: '600',
  }
});
