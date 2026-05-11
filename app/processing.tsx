import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, StyleSheet, Text, View, Image, Pressable } from 'react-native';

import { ScreenShell } from '@/components/nailscan/screen-shell';
import { useNailScanColors } from '@/hooks/use-nailscan-colors';
import {
    getTfliteRuntimeMode,
    preloadTfliteModel,
    runTfliteInference,
    type TflitePrediction,
    type TfliteRuntimeMode,
} from '@/services/tflite-inference';
import { addScanHistoryEntry } from '@/services/scan-history';
import { moderateScale, scale, verticalScale, scaleFont } from '@/utils/ui';

const INFERENCE_TIMEOUT_MS = 25000;

export default function ProcessingScreen() {
  const router = useRouter();
  const colors = useNailScanColors();
  const params = useLocalSearchParams<{ imageUri?: string }>();
  const [prediction, setPrediction] = useState<TflitePrediction | null>(null);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [runtimeMode, setRuntimeMode] = useState<TfliteRuntimeMode>('native-fallback');
  const [phaseText, setPhaseText] = useState('Preparing image for diagnosis');
  const routeTriggeredRef = useRef(false);
  
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    preloadTfliteModel().catch(() => {});
    setRuntimeMode(getTfliteRuntimeMode());

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    const phases = [
      'Preparing image for diagnosis',
      'Enhancing nail region details',
      'Running model inference',
      'Calibrating confidence levels',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % phases.length;
      setPhaseText(phases[idx]);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!params.imageUri) {
      setInferenceError('No image provided.');
      return;
    }

    runTfliteInference(params.imageUri)
      .then((result) => {
        setPrediction(result);
        setInferenceError(null);
      })
      .catch((err) => {
        setInferenceError(err instanceof Error ? err.message : 'Analysis failed');
      });
  }, [params.imageUri]);

  useEffect(() => {
    if (routeTriggeredRef.current) return;

    if (inferenceError) {
      routeTriggeredRef.current = true;
      Alert.alert('Analysis failed', inferenceError, [{ text: 'OK', onPress: () => router.back() }]);
      return;
    }

    if (prediction) {
      routeTriggeredRef.current = true;

      // Save to history before navigating
      addScanHistoryEntry({
        label: prediction.label as any,
        confidence: prediction.confidence ?? 0.9,
        imageUri: params.imageUri,
        runtimeMode: prediction.runtimeMode ?? runtimeMode,
        inferenceTimeMs: prediction.inferenceTimeMs,
      }).catch(console.error);

      const timer = setTimeout(() => {
        router.replace({
          pathname: '/result',
          params: {
            label: prediction.label,
            confidence: `${prediction.confidence}`,
            imageUri: params.imageUri ?? '',
            roi: prediction.roi ? JSON.stringify(prediction.roi) : '',
          },
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [prediction, inferenceError, params.imageUri, router, runtimeMode]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScreenShell variant="default">
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#06245C" />
          </Pressable>
          <Text style={styles.headerTitle}>Diagnosis</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Analyzing Nail Image</Text>
          <Text style={styles.subtitle}>Our AI is carefully analyzing your nail to provide accurate results</Text>
          
          <View style={styles.ringContainer}>
            <Animated.View style={[styles.ring, { transform: [{ rotate: rotation }] }]}>
              <View style={styles.ringDot} />
            </Animated.View>
            <View style={styles.logoBox}>
              <Image 
                source={require('@/assets/images/nailscan-mini-logo.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.phaseText}>{phaseText}</Text>
          <Text style={styles.waitText}>Please wait while NailScan processes your image</Text>
          
          <Ionicons name="hourglass-outline" size={moderateScale(42)} color="#0B55C7" style={styles.hourGlass} />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: verticalScale(5),
    height: verticalScale(52),
  },
  backBtn: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: scaleFont(21),
    fontWeight: '900',
    color: '#071F55',
    textAlign: 'center',
    marginRight: moderateScale(42),
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: verticalScale(40),
  },
  title: {
    fontSize: scaleFont(30),
    fontWeight: '900',
    color: '#071F55',
    textAlign: 'center',
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: '#23416F',
    textAlign: 'center',
    marginTop: verticalScale(14),
    paddingHorizontal: scale(20),
  },
  ringContainer: {
    width: moderateScale(200),
    height: moderateScale(200),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: verticalScale(30),
  },
  ring: {
    width: moderateScale(200),
    height: moderateScale(200),
    borderRadius: moderateScale(100),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dotted',
    position: 'absolute',
  },
  ringDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: '#0B5CFF',
    position: 'absolute',
    top: -6,
    left: moderateScale(94),
  },
  logoBox: {
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 42,
    elevation: 8,
  },
  logo: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  phaseText: {
    fontSize: scaleFont(18),
    fontWeight: '800',
    color: '#071F55',
    marginTop: verticalScale(10),
  },
  waitText: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: '#143875',
    textAlign: 'center',
    marginTop: verticalScale(8),
  },
  hourGlass: {
    marginTop: verticalScale(20),
  },
});


