import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, View, Pressable, type LayoutChangeEvent } from 'react-native';

import { ScreenShell } from '@/components/nailscan/screen-shell';
import { GlassView } from '@/components/nailscan/glass-view';
import { getConditionInfo } from '@/data/diagnosis';
import { useNailScanColors } from '@/hooks/use-nailscan-colors';

export default function ResultScreen() {
  const router = useRouter();
  const colors = useNailScanColors();
  const params = useLocalSearchParams<{ 
    label: string; 
    confidence: string; 
    imageUri: string;
    roi?: string;
  }>();
  
  const label = params.label || 'Healthy';
  const confidence = parseFloat(params.confidence || '0.95');
  const confidencePct = Math.round(confidence * 100);
  const imageUri = params.imageUri;
  const roiRaw = params.roi ? JSON.parse(params.roi) : null;

  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [layoutSize, setLayoutSize] = useState<{ width: number; height: number } | null>(null);
  
  useEffect(() => {
    if (imageUri) {
      Image.getSize(imageUri, (width, height) => {
        setImageSize({ width, height });
      });
    }
  }, [imageUri]);

  const onImageLayout = (event: LayoutChangeEvent) => {
    setLayoutSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };

  const getRoiStyle = () => {
    if (!roiRaw || !imageSize || !layoutSize) return null;

    const scale = Math.max(layoutSize.width / imageSize.width, layoutSize.height / imageSize.height);
    const renderedWidth = imageSize.width * scale;
    const renderedHeight = imageSize.height * scale;
    const offsetX = (layoutSize.width - renderedWidth) / 2;
    const offsetY = (layoutSize.height - renderedHeight) / 2;

    return {
      position: 'absolute' as const,
      left: offsetX + roiRaw.x * scale,
      top: offsetY + roiRaw.y * scale,
      width: roiRaw.width * scale,
      height: roiRaw.height * scale,
      borderWidth: 2,
      borderColor: '#0B5CFF',
      backgroundColor: 'rgba(11, 92, 255, 0.15)',
      borderRadius: 8,
      shadowColor: '#0B5CFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
    };
  };
  
  const info = getConditionInfo(label);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 650,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isHealthy = label.toLowerCase().includes('healthy');
  const isUnidentified = label.toLowerCase().includes('unidentified');
  
  let statusColor = '#0B6BFF'; // Disease/Default
  let statusIcon = 'medical-outline';
  let riskColor = '#FF9500'; // Moderate
  
  if (isHealthy) {
    statusColor = '#159947';
    statusIcon = 'checkmark-circle-outline';
    riskColor = '#159947';
  } else if (isUnidentified) {
    statusColor = '#7A8797';
    statusIcon = 'help-circle-outline';
    riskColor = '#7A8797';
  } else if (info.riskLevel.toLowerCase() === 'high') {
    riskColor = '#FF4D4F';
  }

  return (
    <ScreenShell variant="default">
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#071F55" />
          </Pressable>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Diagnosis Result</Text>
            <Text style={styles.headerSubtitle}>Here's what we found</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Image Preview */}
          <View style={styles.imageBox}>
            <GlassView style={styles.imageBorder} intensity={22}>
              {imageUri ? (
                <View onLayout={onImageLayout} style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
                  {roiRaw && <View style={getRoiStyle()} />}
                  {roiRaw && (
                    <View style={styles.roiLabelBox}>
                      <Ionicons name="scan-outline" size={12} color="white" />
                      <Text style={styles.roiLabelText}>AI Detection Area</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={54} color="white" />
                </View>
              )}
            </GlassView>
          </View>

          {/* Summary Card */}
          <GlassView style={styles.summaryCard} intensity={86}>
            <View style={[styles.iconBubble, { backgroundColor: `${statusColor}20` }]}>
              <Ionicons name={statusIcon as any} size={30} color={statusColor} />
            </View>
            <View style={styles.summaryTextCol}>
              <Text style={[styles.conditionLabel, { color: statusColor }]}>{label}</Text>
              <Text style={styles.conditionSubtitle}>{info.subtitle || 'Analysis result'}</Text>
            </View>
            <View style={styles.confidenceBox}>
              <Text style={styles.confidenceVal}>{confidencePct}%</Text>
              <Text style={styles.confidenceLabel}>Confidence</Text>
            </View>
          </GlassView>

          {/* Saved to History Card */}
          <GlassView style={styles.savedCard} intensity={86}>
            <Ionicons name="checkmark-circle-outline" size={30} color="#159947" />
            <View style={styles.savedTextCol}>
              <Text style={styles.savedTitle}>Saved to History</Text>
              <Text style={styles.savedSubtitle}>You can view this result in your history.</Text>
            </View>
          </GlassView>

          {/* Analysis Details */}
          <GlassView style={styles.detailsCard} intensity={86}>
            <Text style={styles.sectionTitle}>Analysis Details</Text>
            <View style={styles.analysisRow}>
              <AnalysisItem icon="cube-outline" label="Shape" detail={info.shapeDetail} />
              <View style={styles.verticalDivider} />
              <AnalysisItem icon="palette-outline" label="Color" detail={info.colorDetail} />
              <View style={styles.verticalDivider} />
              <AnalysisItem icon="analytics-outline" label="Texture" detail={info.textureDetail} />
            </View>
          </GlassView>

          {/* Detailed Info Cards */}
          <InfoSection icon="document-text-outline" title="Condition Description" content={info.description} />
          <InfoSection icon="bug-outline" title="Underlying Causes" content={info.causes} />
          
          <BulletSection 
            icon="medical-outline" 
            title="Common Symptoms" 
            bullets={info.symptoms} 
            twoColumns 
          />
          
          <BulletSection 
            icon="shield-checkmark-outline" 
            title="Treatment Guidance" 
            bullets={info.treatment} 
          />

          <GlassView style={styles.riskCard} intensity={86}>
            <View style={styles.iconBubble}>
              <Ionicons name="warning-outline" size={24} color="#0B6BFF" />
            </View>
            <View style={styles.riskTextCol}>
              <Text style={styles.sectionTitle}>Risk Level</Text>
              <Text style={[styles.riskLevelVal, { color: riskColor }]}>{info.riskLevel}</Text>
              <Text style={styles.riskNote}>{info.riskNote}</Text>
            </View>
          </GlassView>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <Pressable style={[styles.btn, styles.doneBtn]} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.scanBtn]} onPress={() => router.push('/capture')}>
              <Text style={styles.scanBtnText}>Scan Again</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>
    </ScreenShell>
  );
}

function AnalysisItem({ icon, label, detail }: any) {
  return (
    <View style={styles.analysisItem}>
      <Ionicons name={icon} size={20} color="#0B6BFF" />
      <Text style={styles.analysisLabel}>{label}</Text>
      <Text style={styles.analysisDetail} numberOfLines={3}>{detail}</Text>
    </View>
  );
}

function InfoSection({ icon, title, content }: any) {
  return (
    <GlassView style={styles.infoCard} intensity={86}>
      <View style={styles.iconBubble}>
        <Ionicons name={icon} size={24} color="#0B6BFF" />
      </View>
      <View style={styles.infoTextCol}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.infoContent}>{content}</Text>
      </View>
    </GlassView>
  );
}

function BulletSection({ icon, title, bullets, twoColumns }: any) {
  const midpoint = Math.ceil(bullets.length / 2);
  const left = bullets.slice(0, midpoint);
  const right = bullets.slice(midpoint);

  return (
    <GlassView style={styles.infoCard} intensity={86}>
      <View style={styles.iconBubble}>
        <Ionicons name={icon} size={24} color="#0B6BFF" />
      </View>
      <View style={styles.infoTextCol}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={twoColumns ? styles.bulletRow : null}>
          <View style={twoColumns ? styles.bulletCol : null}>
            {left.map((b: string, i: number) => <BulletItem key={i} text={b} />)}
          </View>
          {twoColumns && (
            <View style={styles.bulletCol}>
              {right.map((b: string, i: number) => <BulletItem key={i} text={b} />)}
            </View>
          )}
        </View>
      </View>
    </GlassView>
  );
}

function BulletItem({ text }: { text: string }) {
  return (
    <View style={styles.bulletItem}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
    alignItems: 'center',
    marginRight: 42,
  },
  headerTitle: {
    color: '#071F55',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: '#3F5F8F',
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 3,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: 10,
  },
  imageBox: {
    height: 210,
    width: '100%',
  },
  imageBorder: {
    flex: 1,
    padding: 2,
    borderRadius: 22,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
  },
  roiLabelBox: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(11, 92, 255, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roiLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#D8EDFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(11, 107, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  conditionLabel: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  conditionSubtitle: {
    color: '#3F5F8F',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  confidenceBox: {
    width: 78,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
  },
  confidenceVal: {
    color: '#0B6BFF',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  confidenceLabel: {
    color: '#3F5F8F',
    fontSize: 11.5,
    fontWeight: '700',
  },
  savedCard: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(21, 153, 71, 0.07)',
  },
  savedTextCol: {
    marginLeft: 14,
  },
  savedTitle: {
    color: '#159947',
    fontSize: 15,
    fontWeight: '900',
  },
  savedSubtitle: {
    color: '#3F5F8F',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 3,
  },
  detailsCard: {
    padding: 14,
  },
  sectionTitle: {
    color: '#071F55',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 14,
  },
  analysisRow: {
    flexDirection: 'row',
  },
  analysisItem: {
    flex: 1,
  },
  analysisLabel: {
    color: '#071F55',
    fontSize: 12.5,
    fontWeight: '900',
    marginTop: 8,
  },
  analysisDetail: {
    color: '#3F5F8F',
    fontSize: 11.8,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    height: 96,
    backgroundColor: 'rgba(185, 217, 255, 0.85)',
    marginHorizontal: 10,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 14,
  },
  infoTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  infoContent: {
    color: '#3F5F8F',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bulletCol: {
    flex: 1,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0B6BFF',
    marginTop: 6,
    marginRight: 8,
  },
  bulletText: {
    color: '#3F5F8F',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  riskCard: {
    flexDirection: 'row',
    padding: 14,
  },
  riskTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  riskLevelVal: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: -8,
  },
  riskNote: {
    color: '#3F5F8F',
    fontSize: 12.3,
    lineHeight: 17,
    fontWeight: '600',
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtn: {
    backgroundColor: '#0B6BFF',
  },
  doneBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  scanBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 255, 0.3)',
  },
  scanBtnText: {
    color: '#0B6BFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
