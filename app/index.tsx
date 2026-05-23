import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageBackground, StyleSheet, Text, View } from 'react-native';

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
    <ImageBackground 
      source={require('@/assets/images/background.png')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.8 }}
    >
      <Animated.View style={[styles.content, { opacity: fade, zIndex: 10 }]}>
        <GlassView
          intensity={40}
          borderRadius={34}
          backgroundColor="rgba(255, 255, 255, 0.18)"
          borderColor="rgba(255, 255, 255, 0.42)"
          borderWidth={1.4}
          style={styles.logoTile}
        >
          <Image source={require('@/assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
        </GlassView>

        <Text style={styles.name}>NailScan</Text>

        <View style={styles.taglinePill}>
          <Text style={styles.taglineText}>AI Nail Health Analysis</Text>
        </View>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2FF',
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
    shadowColor: '#006DFF',
    shadowOpacity: 0.15,
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
    color: '#071F55',
    letterSpacing: -0.5,
    marginBottom: verticalScale(7),
  },
  taglinePill: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(7),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  taglineText: {
    fontSize: scaleFont(13),
    fontWeight: '700',
    color: '#0B2E6F',
  },
});

