import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ImageBackground, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { GlassView } from '@/components/nailscan/glass-view';

export default function AboutScreen() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <ImageBackground
      source={require('@/assets/images/background.png')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.8 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0 }}>
        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.push('/')} style={styles.headerIconBtn}>
              <Ionicons name="chevron-back" size={20} color="#0B2E6F" />
            </Pressable>
            <Text style={styles.headerTitle}>About</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Logo & Info */}
            <View style={styles.logoSection}>
              <View style={styles.logoBox}>
                <Image
                  source={require('@/assets/images/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.appName}>NailScan</Text>
              <Text style={styles.appTagline}>AI-Powered Nail Health Analysis</Text>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
            </View>

            <View style={styles.menuContainer}>
              <ExpandableTile
                id="what"
                title="What is NailScan?"
                customIcon={
                  <View style={styles.smallLogoBox}>
                    <Image
                      source={require('@/assets/images/logo.png')}
                      style={styles.smallLogoImage}
                      resizeMode="contain"
                    />
                  </View>
                }
                isExpanded={expandedSection === 'what'}
                onToggle={() => toggleSection('what')}
              >
                <Text style={styles.expandableText}>
                  NailScan is a mobile application designed to assist in identifying visible nail conditions using image analysis. It aims to provide quick preliminary screening based on nail appearance patterns.
                </Text>
              </ExpandableTile>

              <ExpandableTile
                id="how"
                title="How It Works"
                icon="sparkles"
                isExpanded={expandedSection === 'how'}
                onToggle={() => toggleSection('how')}
              >
                <Text style={styles.expandableText}>
                  NailScan analyzes a captured or uploaded fingernail image and checks visible nail patterns such as color, shape, and texture.
                </Text>
                <View style={styles.stepRow}>
                  <StepNumber number={1} />
                  <Text style={styles.stepText}>Capture or upload a clear nail photo</Text>
                </View>
                <View style={styles.stepRow}>
                  <StepNumber number={2} />
                  <Text style={styles.stepText}>AI analyzes visible nail features</Text>
                </View>
                <View style={styles.stepRow}>
                  <StepNumber number={3} />
                  <Text style={styles.stepText}>Result appears with analysis details</Text>
                  {/* Commented out as requested:
                  <Text style={styles.stepText}>Result appears with confidence score</Text>
                  */}
                </View>
              </ExpandableTile>

              <ExpandableTile
                id="conditions"
                title="Conditions Detected"
                icon="medical-outline"
                isExpanded={expandedSection === 'conditions'}
                onToggle={() => toggleSection('conditions')}
              >
                <ConditionItem name="Acral Lentiginous Melanoma" description="A serious type of melanoma that may appear as an irregular dark streak or band on the nail and can gradually widen, darken, or spread to nearby skin." color="#000103ff" />
                <ConditionItem name="Beau's Lines" description="Horizontal grooves or dents across the nail plate caused by a temporary interruption in nail growth." color="#000103ff" />
                <ConditionItem name="Blue Finger" description="Blue Finger is a condition where the fingernails appear blue or purplish, often due to a lack of oxygen in the blood." color="#000103ff" />
                <ConditionItem name="Koilonychia" description="Concave or spoon-shaped nails commonly associated with iron deficiency anemia or related medical conditions." color="#000103ff" />
                <ConditionItem name="Muehrcke's Lines" description="Multiple horizontal white lines across the fingernails that may be linked to low albumin levels or systemic conditions." color="#000103ff" />
                <ConditionItem name="Nail Clubbing" description="Rounded and enlarged fingertips with downward nail curvature, possibly linked to underlying lung, heart, digestive, or systemic conditions." color="#000103ff" />
                <ConditionItem name="Nail Pitting" description="Multiple small pin-like dents on the nail surface that may be associated with psoriasis, autoimmune diseases, or skin conditions." color="#000103ff" />
                <ConditionItem name="Healthy Nails" description="Smooth, evenly shaped nails with consistent color and no visible grooves, dents, thickening, swelling, or deformity." color="#000103ff" />
                <ConditionItem name="Unidentified" description="The image may be unclear, unsupported, or outside the current detection scope of the application." color="#000103ff" />
              </ExpandableTile>

              <ExpandableTile
                id="notice"
                title="Important Notice"
                icon="warning-outline"
                isExpanded={expandedSection === 'notice'}
                onToggle={() => toggleSection('notice')}
              >
                <View style={styles.noticeBox}>
                  <Text style={styles.noticeText}>
                    This app is intended for preliminary screening only and does not replace professional medical diagnosis. Always consult a qualified healthcare professional for proper medical advice and treatment.
                  </Text>
                </View>
              </ExpandableTile>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function ExpandableTile({ id, title, icon, customIcon, isExpanded, onToggle, children }: any) {
  return (
    <View style={styles.tileWrapper}>
      <Pressable onPress={onToggle}>
        <GlassView
          style={styles.tileContainer}
          intensity={70}
          borderRadius={18}
          backgroundColor="rgba(255,255,255,0.74)"
          borderColor="#CFE0FF"
          borderWidth={1.2}
        >
          <View style={styles.tileHeader}>
            {customIcon ? customIcon : <Ionicons name={icon} size={22} color="#0F62FE" />}
            <Text style={styles.tileTitle}>{title}</Text>
            <Ionicons
              name={isExpanded ? "chevron-down" : "chevron-forward"}
              size={20}
              color="#8AA6D6"
            />
          </View>
          {isExpanded && (
            <View style={styles.tileContent}>
              {children}
            </View>
          )}
        </GlassView>
      </Pressable>
    </View>
  );
}

function StepNumber({ number }: { number: number }) {
  return (
    <View style={styles.stepNumberBox}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
  );
}

function ConditionItem({ name, description, color }: any) {
  return (
    <View style={styles.conditionItem}>
      <View style={[styles.conditionDot, { backgroundColor: color }]} />
      <View style={styles.conditionTextCol}>
        <Text style={styles.conditionName}>{name}</Text>
        <Text style={styles.conditionDesc}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2FF',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0B2E6F',
    marginLeft: 10,
  },
  scrollContent: {
    paddingTop: 20,
    // Clear the absolute tab bar
    paddingBottom: 120,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBox: {
    width: 82,
    height: 82,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  smallLogoBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallLogoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B2E6F',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4667A0',
    marginTop: 6,
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8BA2C9',
    marginTop: 6,
  },
  menuContainer: {
    gap: 8,
  },
  tileWrapper: {
    width: '100%',
  },
  tileContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  tileTitle: {
    flex: 1,
    marginLeft: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#4667A0',
  },
  tileContent: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  expandableText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
    color: '#0B2E6F',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  stepNumberBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EAF2FF',
    borderWidth: 1,
    borderColor: '#8AB6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F62FE',
  },
  stepText: {
    flex: 1,
    marginLeft: 14,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4667A0',
  },
  conditionItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  conditionDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  conditionTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  conditionName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0B2E6F',
  },
  conditionDesc: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#4667A0',
    marginTop: 4,
    lineHeight: 18,
  },
  noticeBox: {
    backgroundColor: '#EAF2FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CFE0FF',
  },
  noticeText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
    color: '#0B2E6F',
  },
});
