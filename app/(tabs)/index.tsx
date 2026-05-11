import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import { GlassView } from '@/components/nailscan/glass-view';
import { useNailScanColors } from '@/hooks/use-nailscan-colors';
import { preloadTfliteModel } from '@/services/tflite-inference';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useNailScanColors();

  const fadeRef = useRef(new Animated.Value(0)).current;
  const slideRef = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    preloadTfliteModel().catch(console.warn);

    Animated.parallel([
      Animated.timing(fadeRef, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideRef, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStartDiagnosis = () => {
    router.push('/capture');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeRef, transform: [{ translateY: slideRef }] }]}>
        {/* Exact background gradient */}
        <LinearGradient
          colors={['#D5EBFF', '#EEF7FF', '#BFDFFF', '#88C4FF']}
          locations={[0, 0.34, 0.72, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Restored Soft Circles with extremely low opacity to prevent hard blob effect on Android, 
            while restoring the missing top-left glow. */}
        <View style={[styles.softCircle, { top: -60, right: -60, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.18)' }]} />
        <View style={[styles.softCircle, { top: -80, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.25)' }]} />
        <View style={[styles.softCircle, { bottom: 80, right: -45, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.12)' }]} />

        {/* Bokeh Dots (exact Flutter positioning) */}
        <View style={[styles.bokehDot, { left: '8%', top: '13%', width: 30, height: 30, borderRadius: 15, opacity: 0.14 }]} />
        <View style={[styles.bokehDot, { left: '73%', top: '18%', width: 42, height: 42, borderRadius: 21, opacity: 0.14 }]} />
        <View style={[styles.bokehDot, { left: '92%', top: '8%', width: 24, height: 24, borderRadius: 12, opacity: 0.18 }]} />
        <View style={[styles.bokehDot, { left: '20%', top: '55%', width: 20, height: 20, borderRadius: 10, opacity: 0.12 }]} />
        <View style={[styles.bokehDot, { left: '82%', top: '61%', width: 40, height: 40, borderRadius: 20, opacity: 0.12 }]} />
        <View style={[styles.bokehDot, { left: '48%', top: '86%', width: 26, height: 26, borderRadius: 13, opacity: 0.12 }]} />

        {/* SafeArea padding simulation to exactly match Flutter's 20px padding */}
        <View style={styles.safeArea}>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>NailScan</Text>
              <View style={{ height: 3 }} />
              <Text style={styles.subtitle}>AI Nail Health Analysis</Text>
              <View style={{ height: 12 }} />
              <Text style={styles.description}>
                Scan your fingernail for fast AI-powered nail health screening.
              </Text>
            </View>
            <View style={{ width: 14 }} />

            <GlassView style={styles.logoBox} intensity={34}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </GlassView>
          </View>

          <View style={styles.spacer} />

          {/* Feature Section */}
          <GlassView style={styles.featureSection} intensity={34}>
            <FeatureCard
              icon="flash"
              title="Instant Analysis"
              subtitle="Get results in seconds."
              showDivider
            />
            <FeatureCard
              icon="time"
              title="Scan History"
              subtitle="View your previous scans."
              showDivider
            />
            <FeatureCard
              icon="lock-closed"
              title="Private & Secure"
              subtitle="Your data is stored only on your device."
            />
          </GlassView>

          <View style={styles.spacer} />

          {/* Start Button */}
          <Pressable onPress={handleStartDiagnosis} style={styles.startButtonContainer}>
            <View style={styles.startButton}>
              <LinearGradient
                colors={['#3B82F6', '#0B5CFF', '#1D4ED8']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.startButtonBorder} />
              <View style={styles.startButtonHighlight}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.23)', 'rgba(255,255,255,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
              <View style={styles.startButtonRow}>
                <Ionicons name="sparkles" size={22} color="white" />
                <View style={{ width: 10 }} />
                <Text style={styles.startButtonText}>Start Scan</Text>
              </View>
            </View>
          </Pressable>

        </View>
      </Animated.View>
    </View>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  subtitle: string;
  showDivider?: boolean;
}

function FeatureCard({ icon, title, subtitle, showDivider }: FeatureCardProps) {
  return (
    <View>
      <View style={styles.featureCardRow}>
        <View style={styles.featureIconBox}>
          <Ionicons name={icon as any} size={28} color="#0B5CFF" />
        </View>
        <View style={{ width: 18 }} />
        <View style={styles.featureTextBox}>
          <Text style={styles.featureTitle}>{title}</Text>
          <View style={{ height: 3 }} />
          <Text style={styles.featureSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {showDivider && <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2FF',
  },
  animatedContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 20 : 60,
    paddingHorizontal: 20,
    paddingBottom: 42 + 86, // Add bottom padding to account for absolute tab bar height
  },
  softCircle: {
    position: 'absolute',
  },
  bokehDot: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerTextCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0A2A66',
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#46639A',
  },
  description: {
    fontSize: 16,
    lineHeight: 22.4, // 1.4 height
    fontWeight: '600',
    color: '#5F79A6',
  },
  logoBox: {
    width: 62,
    height: 62,
    padding: 9,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.44)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#0B5CFF',
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 18,
    shadowOpacity: 0.12,
    elevation: 0, // Fixes Android solid white background bug on semi-transparent views
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  spacer: {
    flex: 1,
  },
  featureSection: {
    width: '100%',
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 22,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
    borderWidth: 1.6,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    // Fake the shadow via GlassView wrapper container styles or keep it here
    shadowColor: '#0B5CFF',
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 34,
    shadowOpacity: 0.12,
    elevation: 0, // Fixes Android solid white background bug
    overflow: 'hidden',
  },
  featureCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  featureIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.54)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0A2A66',
  },
  featureSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B84A8',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(10, 42, 102, 0.08)',
  },
  startButtonContainer: {
    width: '100%',
    height: 62,
    borderRadius: 32,
    backgroundColor: '#0B5CFF', // Required for Android to cast elevation shadow
    shadowColor: '#0B5CFF',
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 28,
    shadowOpacity: 0.36,
    elevation: 12,
  },
  startButton: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  startButtonHighlight: {
    position: 'absolute',
    top: 0,
    left: 22,
    right: 22,
    height: 28,
    borderRadius: 999,
    overflow: 'hidden',
  },
  startButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
