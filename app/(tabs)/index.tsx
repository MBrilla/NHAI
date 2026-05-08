import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassView } from '@/components/nailscan/glass-view';
import { ScreenShell } from '@/components/nailscan/screen-shell';
import { useNailScanColors } from '@/hooks/use-nailscan-colors';
import { preloadTfliteModel } from '@/services/tflite-inference';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useNailScanColors();

  // Animation refs
  const fadeRef = useRef(new Animated.Value(0)).current;
  const slideRef = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Start pre-loading and warming up models as soon as the app starts
    // to ensure zero-latency inference later.
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
    <ScreenShell variant="default">
      <Animated.View style={[styles.container, { opacity: fadeRef, transform: [{ translateY: slideRef }] }]}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>NailScan</Text>
            <Text style={styles.subtitle}>AI Nail Health Analysis</Text>
            <Text style={styles.description}>
              Scan your fingernail for fast AI-powered nail health screening.
            </Text>
          </View>
          <GlassView style={styles.logoBox} intensity={44}>
            <Image
              source={require('@/assets/images/nailscan-mini-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </GlassView>
        </View>

        <View style={styles.spacer} />

        {/* Feature Section */}
        <GlassView style={styles.featureSection} intensity={34}>
          <FeatureCard
            icon="flash-outline"
            title="Instant Analysis"
            subtitle="Get results in seconds."
            showDivider
          />
          <FeatureCard
            icon="time-outline"
            title="Scan History"
            subtitle="View your previous scans."
            showDivider
          />
          <FeatureCard
            icon="lock-closed-outline"
            title="Private & Secure"
            subtitle="Your data is stored only on your device."
          />
        </GlassView>

        <View style={styles.spacer} />

        {/* Start Button */}
        <Pressable onPress={handleStartDiagnosis} style={styles.startButtonContainer}>
          <View style={styles.startButton}>
            <View style={styles.startButtonHighlight} />
            <View style={styles.startButtonRow}>
              <Ionicons name="sparkles" size={22} color="white" />
              <Text style={styles.startButtonText}>Start Scan</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </ScreenShell>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  subtitle: string;
  showDivider?: boolean;
}

function FeatureCard({ icon, title, subtitle, showDivider }: FeatureCardProps) {
  const colors = useNailScanColors();
  return (
    <View style={styles.featureCardContainer}>
      <View style={styles.featureCardRow}>
        <View style={styles.featureIconBox}>
          <Ionicons name={icon as any} size={28} color={colors.primary} />
        </View>
        <View style={styles.featureTextBox}>
          <Text style={styles.featureTitle}>{title}</Text>
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
    paddingTop: 20,
    paddingBottom: 52,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    paddingRight: 14,
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
    marginTop: 3,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#5F79A6',
    marginTop: 12,
  },
  logoBox: {
    width: 62,
    height: 62,
    padding: 9,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  featureCardContainer: {
    width: '100%',
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
    marginLeft: 18,
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
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(10, 42, 102, 0.08)',
  },
  startButtonContainer: {
    width: '100%',
    height: 59,
  },
  startButton: {
    flex: 1,
    borderRadius: 31,
    backgroundColor: '#0B5CFF', // Base color, would ideally be a gradient
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0B5CFF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.36,
    shadowRadius: 28,
    elevation: 12,
    overflow: 'hidden',
  },
  startButtonHighlight: {
    position: 'absolute',
    top: 0,
    left: 22,
    right: 22,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.23)',
    borderRadius: 999,
  },
  startButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 10,
    letterSpacing: 0.2,
  },
});


