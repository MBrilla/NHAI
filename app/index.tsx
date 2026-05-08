import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNailScanColors } from '@/hooks/use-nailscan-colors';

export default function SplashRoute() {
  const router = useRouter();
  const colors = useNailScanColors();
  const styles = makeStyles(colors);
  const fade = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delayMs: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(dot, {
            toValue: -10,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(300),
        ])
      );

    Animated.timing(fade, { toValue: 1, duration: 1000, useNativeDriver: true }).start();

    const dotsAnimation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]);
    dotsAnimation.start();

    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2300);

    return () => {
      clearTimeout(timer);
      dotsAnimation.stop();
    };
  }, [dot1, dot2, dot3, fade, router]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#EFF6FF', '#FFFFFF']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.backgroundGradient}
      />

      <View style={styles.topSection}>
        <Animated.View style={[styles.logoWrap, { opacity: fade }]}>
          <View style={styles.logoTile}>
            <Image source={require('@/assets/images/nailscan-mini-logo.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
        </Animated.View>
      </View>

      <View style={styles.centerSection}>
        <Animated.View style={{ opacity: fade }}>
          <Text style={styles.name}>NailScan</Text>
          <Text style={styles.tagline}>AI-Powered Nail Health Analysis</Text>
        </Animated.View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.dotRow}>
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ReturnType<typeof useNailScanColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topSection: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  bottomSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTile: {
    width: 128,
    height: 128,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  logoImage: {
    width: 86,
    height: 86,
  },
  name: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  tagline: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
});
