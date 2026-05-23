import { useLocalSearchParams, useRouter } from 'expo-router';
import { ImageBackground, SafeAreaView, StatusBar, Platform, StyleSheet } from 'react-native';
import { ResultView } from '@/components/nailscan/result-view';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    id?: string;
    label: string; 
    confidence: string; 
    imageUri: string;
    originalImageUri?: string;
    roi?: string;
    timestamp?: string;
  }>();
  
  const label = params.label || 'Healthy';
  const confidence = parseFloat(params.confidence || '0.95');
  const imageUri = params.imageUri;
  const originalImageUri = params.originalImageUri;
  const roi = params.roi ? JSON.parse(params.roi) : undefined;
  const timestamp = params.timestamp ? parseInt(params.timestamp) : Date.now();

  return (
    <ImageBackground 
      source={require('@/assets/images/background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0 }}>
        <ResultView 
          label={label}
          confidence={confidence}
          imageUri={imageUri}
          originalImageUri={originalImageUri}
          roi={roi}
          timestamp={timestamp}
          isHistory={false}
          onBack={() => router.back()}
          onScanAgain={() => router.replace('/capture')}
          onDone={() => router.replace('/(tabs)')}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2FF',
  }
});
