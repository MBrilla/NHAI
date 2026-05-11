import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { GlassView } from '@/components/nailscan/glass-view';
import { ScreenShell } from '@/components/nailscan/screen-shell';
import { useNailScanColors } from '@/hooks/use-nailscan-colors';
import { preloadTfliteModel } from '@/services/tflite-inference';
import { moderateScale, scale, verticalScale, scaleFont } from '@/utils/ui';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useNailScanColors();
  const { height: screenHeight } = useWindowDimensions();

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

  // Adjust layout based on screen height to avoid pushing button off-screen
  const isTallScreen = screenHeight > 800;

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

        <View style={isTallScreen ? styles.spacerLarge : styles.spacerSmall} />

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

        <View style={isTallScreen ? styles.spacerLarge : styles.spacerSmall} />

        {/* Start Button */}
        <View style={styles.buttonWrapper}>
          <Pressable onPress={handleStartDiagnosis} style={styles.startButtonContainer}>
            <View style={styles.startButton}>
              <View style={styles.startButtonHighlight} />
              <View style={styles.startButtonRow}>
                <Ionicons name="sparkles" size={moderateScale(22)} color="white" />
                <Text style={styles.startButtonText}>Start Scan</Text>
              </View>
            </View>
          </Pressable>
        </View>
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
          <Ionicons name={icon as any} size={moderateScale(28)} color={colors.primary} />
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
    paddingTop: verticalScale(10),
    // Increase padding to clear the 68px absolute tab bar + 32px breathing room (Global fix)
    paddingBottom: verticalScale(100),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    paddingRight: scale(14),
  },
  title: {
    fontSize: scaleFont(34),
    fontWeight: '900',
    color: '#0A2A66',
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#46639A',
    marginTop: verticalScale(3),
  },
  description: {
    fontSize: scaleFont(16),
    lineHeight: verticalScale(22),
    fontWeight: '600',
    color: '#5F79A6',
    marginTop: verticalScale(12),
  },
  logoBox: {
    width: moderateScale(62),
    height: moderateScale(62),
    padding: moderateScale(9),
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  spacerSmall: {
    height: verticalScale(20),
  },
  spacerLarge: {
    flex: 1,
    minHeight: verticalScale(20),
  },
  featureSection: {
    width: '100%',
    paddingHorizontal: scale(22),
    paddingVertical: verticalScale(10),
  },
  featureCardContainer: {
    width: '100%',
  },
  featureCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(14),
  },
  featureIconBox: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.54)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextBox: {
    marginLeft: scale(18),
    flex: 1,
  },
  featureTitle: {
    fontSize: scaleFont(16),
    fontWeight: '900',
    color: '#0A2A66',
  },
  featureSubtitle: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#6B84A8',
    marginTop: verticalScale(3),
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(10, 42, 102, 0.08)',
  },
  scrollContent: {
    paddingTop: 20,
    // Clear the 68px absolute tab bar
    paddingBottom: 100,
    gap: 14,
  },
  buttonWrapper: {
    width: '100%',
    paddingBottom: verticalScale(16),
  },
  startButtonContainer: {
    width: '100%',
    height: moderateScale(64),
  },
  startButton: {
    flex: 1,
    borderRadius: moderateScale(32),
    backgroundColor: '#0B5CFF',
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
    left: scale(22),
    right: scale(22),
    height: verticalScale(28),
    backgroundColor: 'rgba(255, 255, 255, 0.23)',
    borderRadius: 999,
  },
  startButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: scaleFont(18),
    fontWeight: '900',
    marginLeft: scale(10),
    letterSpacing: 0.2,
  },
});




