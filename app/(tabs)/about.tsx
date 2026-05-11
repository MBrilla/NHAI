import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, SafeAreaView, StatusBar, Platform } from 'react-native';

import { GlassView } from '@/components/nailscan/glass-view';
import { useNailScanColors } from '@/hooks/use-nailscan-colors';

export default function AboutScreen() {
  const router = useRouter();
  const colors = useNailScanColors();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#D5EBFF', '#EEF7FF', '#BFDFFF', '#88C4FF']}
        locations={[0, 0.34, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
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
            <GlassView style={styles.logoBox} intensity={40}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </GlassView>
            <Text style={styles.appName}>NailScan</Text>
            <Text style={styles.appTagline}>AI-Powered Nail Health Analysis</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </View>

          <View style={styles.menuContainer}>
            <ExpandableTile
              id="what"
              title="What is NailScan?"
              icon="help-circle-outline"
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
              icon="flash-outline"
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
                <Text style={styles.stepText}>Result appears with confidence score</Text>
              </View>
            </ExpandableTile>

            <ExpandableTile
              id="conditions"
              title="Conditions Detected"
              icon="medical-outline"
              isExpanded={expandedSection === 'conditions'}
              onToggle={() => toggleSection('conditions')}
            >
              <ConditionItem name="Acral Lentiginous Melanoma" description="Rare melanoma subtype often seen as a dark vertical streak." color="#0F62FE" />
              <ConditionItem name="Onychogryphosis" description="Thickened, curved, claw-like nails that progress over time." color="#FFA043" />
              <ConditionItem name="Nail Clubbing" description="Downward curving nails, can be linked to systemic disease." color="#8BB8FF" />
              <ConditionItem name="Healthy Nail" description="Normal appearance with no visible abnormalities." color="#35C58A" />
              <ConditionItem name="Unidentified" description="Low confidence scan, requires clearer image." color="#94A3B8" />
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
                  This app is intended for preliminary screening only and does not replace professional medical diagnosis. Always consult a qualified healthcare professional for medical advice.
                </Text>
              </View>
            </ExpandableTile>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  </View>
);
}

function ExpandableTile({ id, title, icon, isExpanded, onToggle, children }: any) {
  return (
    <View style={styles.tileWrapper}>
      <Pressable onPress={onToggle}>
        <GlassView style={styles.tileContainer} intensity={92}>
          <View style={styles.tileHeader}>
            <Ionicons name={icon} size={22} color="#0F62FE" />
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
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
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
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
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
    width: 12,
    height: 12,
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
