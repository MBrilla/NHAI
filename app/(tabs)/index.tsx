import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageBackground, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GlassView } from '@/components/nailscan/glass-view';
import { preloadTfliteModel } from '@/services/tflite-inference';

export default function HomeScreen() {
  const router = useRouter();

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
    <ImageBackground 
      source={require('@/assets/images/background.png')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.8 }}
    >
      <Animated.View style={[styles.safeArea, { opacity: fadeRef, transform: [{ translateY: slideRef }] }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>NailScan</Text>
            <Text style={styles.subtitle}>AI Nail Health Analysis</Text>
            <Text style={styles.description}>
              Scan your fingernail for fast AI-powered nail health screening.
            </Text>
          </View>
          
          <GlassView 
            style={styles.logoBox} 
            intensity={40} 
            borderRadius={24} 
            backgroundColor="rgba(255,255,255,0.44)" 
            borderColor="rgba(255,255,255,0.75)"
          >
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </GlassView>
        </View>

        <View style={styles.spacer} />

        {/* Feature Section */}
        <GlassView
          style={styles.featureCard}
          intensity={60}
          borderRadius={32}
          backgroundColor="rgba(255,255,255,0.18)"
          borderColor="rgba(255,255,255,0.35)"
          borderWidth={1.4}
        >
          <FeatureRow 
            icon="flash" 
            title="Instant Analysis" 
            subtitle="Get results in seconds." 
            showDivider={true} 
          />
          <FeatureRow 
            icon="time" 
            title="Scan History" 
            subtitle="View your previous scans." 
            showDivider={true} 
          />
          <FeatureRow 
            icon="lock-closed" 
            title="Private & Secure" 
            subtitle="Your data is stored only on your device." 
            showDivider={false} 
          />
        </GlassView>

        <View style={styles.spacer} />

        {/* Primary Button */}
        <Pressable onPress={handleStartDiagnosis} style={({pressed}) => [styles.startButton, pressed && {opacity: 0.8}]}>
          <LinearGradient
            colors={['#3B82F6', '#0B5CFF', '#1D4ED8']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Inner white shine overlay at top */}
          <LinearGradient
            colors={['rgba(255,255,255,0.23)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.buttonShine}
          />
          <View style={styles.startButtonContent}>
            <Ionicons name="sparkles" size={22} color="white" />
            <Text style={styles.startButtonText}>Start Scan</Text>
          </View>
        </Pressable>
      </Animated.View>
    </ImageBackground>
  );
}

function FeatureRow({ icon, title, subtitle, showDivider }: { icon: any, title: string, subtitle: string, showDivider: boolean }) {
  return (
    <View style={styles.featureRowContainer}>
      <View style={styles.featureRowContent}>
        <View style={styles.featureIconBox}>
          <Ionicons name={icon} size={24} color="#0B5CFF" />
        </View>
        <View style={styles.featureTextCol}>
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
    backgroundColor: '#EAF2FF', // light blue base
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 20 : 60,
    paddingHorizontal: 20,
    paddingBottom: 42 + 86,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0A2A66',
    letterSpacing: -0.7,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#355C9A',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  description: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#3E557C',
    lineHeight: 23,
  },
  logoBox: {
    width: 62,
    height: 62,
    padding: 9,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0B5CFF',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  spacer: {
    flex: 1,
  },
  featureCard: {
    width: '100%',
    paddingHorizontal: 22,
    paddingVertical: 18,
    shadowColor: '#0B5CFF',
    shadowOpacity: 0.12,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  featureRowContainer: {
    width: '100%',
  },
  featureRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  featureIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.54)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0A2A66',
    marginBottom: 3,
  },
  featureSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B84A8',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(10,42,102,0.08)',
  },
  startButton: {
    width: '100%',
    height: 62,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#0B5CFF',
    shadowOpacity: 0.36,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: 22,
    right: 22,
    height: 28,
    borderRadius: 14,
  },
  startButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginLeft: 10,
  },
});
