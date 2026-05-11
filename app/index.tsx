import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';

import { GlassView } from '@/components/nailscan/glass-view';
import { moderateScale, scale, scaleFont, verticalScale } from '@/utils/ui';

export default function SplashRoute() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2800);

    return () => {
      clearTimeout(timer);
    };
  }, [fade, router]);

  return (
    <View style={styles.container}>
      {/* Premium Blue Background */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB', '#3B82F6', '#BFE2FF']}
        locations={[0, 0.42, 0.78, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Simulated Soft Glows */}
      <View style={[styles.glow, { top: -70, left: -55, width: 190, height: 190, borderRadius: 95, opacity: 0.2 }]} />
      <View style={[styles.glow, { top: 90, right: -80, width: 230, height: 230, borderRadius: 115, opacity: 0.15 }]} />
      <View style={[styles.glow, { bottom: -80, left: 55, width: 230, height: 230, borderRadius: 115, opacity: 0.12 }]} />

      {/* Simulated Bokeh Dots */}
      <View style={[styles.bokehDot, { top: '10%', left: '10%', width: 36, height: 36, borderRadius: 18, opacity: 0.16 }]} />
      <View style={[styles.bokehDot, { top: '8%', right: '10%', width: 24, height: 24, borderRadius: 12, opacity: 0.16 }]} />
      <View style={[styles.bokehDot, { top: '38%', left: '16%', width: 52, height: 52, borderRadius: 26, opacity: 0.1 }]} />
      <View style={[styles.bokehDot, { top: '30%', right: '22%', width: 76, height: 76, borderRadius: 38, opacity: 0.13 }]} />
      <View style={[styles.bokehDot, { top: '72%', right: '14%', width: 44, height: 44, borderRadius: 22, opacity: 0.12 }]} />
      <View style={[styles.bokehDot, { top: '78%', left: '24%', width: 32, height: 32, borderRadius: 16, opacity: 0.12 }]} />

      <Animated.View style={[styles.content, { opacity: fade }]}>
        <GlassView
          intensity={40}
          borderRadius={34}
          backgroundColor="rgba(255, 255, 255, 0.18)"
          borderColor="rgba(255, 255, 255, 0.42)"
          borderWidth={1.4}
          style={styles.logoTile}
        >
          <Image source={require('@/assets/images/nailscan-mini-logo.png')} style={styles.logoImage} resizeMode="contain" />
        </GlassView>

        <Text style={styles.name}>NailScan</Text>
        
        <View style={styles.taglinePill}>
          <Text style={styles.taglineText}>AI Nail Health Analysis</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  glow: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  bokehDot: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTile: {
    width: moderateScale(118),
    height: moderateScale(118),
    padding: moderateScale(19),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B5CFF',
    shadowOpacity: 0.3,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
    marginBottom: verticalScale(24),
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: scaleFont(32),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: verticalScale(7),
  },
  taglinePill: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(7),
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  taglineText: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
