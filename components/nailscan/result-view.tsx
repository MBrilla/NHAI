import { GlassView } from '@/components/nailscan/glass-view';
import { getConditionInfo } from '@/data/diagnosis';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface ResultViewProps {
  label: string;
  confidence: number;
  imageUri?: string;
  originalImageUri?: string;
  roi?: { x: number; y: number; width: number; height: number };
  timestamp?: number;
  qualityFlags?: string[];
  isHistory?: boolean;
  onBack: () => void;
  onScanAgain: () => void;
  onDone: () => void;
  onDelete?: () => void;
}

export function ResultView({
  label,
  confidence,
  imageUri,
  originalImageUri,
  roi,
  timestamp,
  qualityFlags,
  isHistory = false,
  onBack,
  onScanAgain,
  onDone,
  onDelete,
}: ResultViewProps) {
  const info = getConditionInfo(label as any);

  const [treatmentExpanded, setTreatmentExpanded] = useState(false);
  const [recsExpanded, setRecsExpanded] = useState(false);
  const [confidenceExpanded, setConfidenceExpanded] = useState(false);

  const [showDetectionModal, setShowDetectionModal] = useState(false);
  const [imgWidth, setImgWidth] = useState(1);
  const [imgHeight, setImgHeight] = useState(1);

  useEffect(() => {
    if (originalImageUri) {
      Image.getSize(
        originalImageUri,
        (width, height) => {
          setImgWidth(width || 1);
          setImgHeight(height || 1);
        },
        (error) => {
          console.log('Error getting original image size:', error);
          setImgWidth(320);
          setImgHeight(320);
        }
      );
    }
  }, [originalImageUri]);

  const hasROI = !!(roi && originalImageUri && roi.width > 0 && roi.height > 0);
  const screenWidth = Dimensions.get('window').width;
  const displayWidth = Math.min(300, screenWidth - 80);
  const displayHeight = (imgHeight / imgWidth) * displayWidth;
  const scale = displayWidth / imgWidth;

  const rx = Number(roi?.x || 0);
  const ry = Number(roi?.y || 0);
  const rw = Number(roi?.width || 0);
  const rh = Number(roi?.height || 0);

  const boxStyle = {
    position: 'absolute' as const,
    left: rx * scale,
    top: ry * scale,
    width: rw * scale,
    height: rh * scale,
    borderColor: '#00E5FF',
    borderWidth: 2,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderRadius: 6,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isHealthy = label.toLowerCase().includes('healthy');
  const isUnidentified = label.toLowerCase().includes('unidentified');

  let riskColor = '#FF9500'; // Moderate
  let titleIcon = 'warning';

  if (isHealthy) {
    riskColor = '#159947';
    titleIcon = 'checkmark-circle';
  } else if (isUnidentified) {
    riskColor = '#7A8797';
    titleIcon = 'help-circle';
  } else if (info.riskLevel.toLowerCase() === 'high') {
    riskColor = '#D71920';
  }

  const dateStr = timestamp ? format(new Date(timestamp), 'MMM d, yyyy HH:mm') : format(new Date(), 'MMM d, yyyy HH:mm');
  const confPct = Math.round(confidence * 100);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onBack} style={styles.headerIconBtn}>
            <Ionicons name="chevron-back" size={24} color="#0B2E6F" />
          </Pressable>
          <Text style={styles.headerTitle}>Scan Details</Text>
        </View>
        <Pressable
          onPress={onDelete}
          disabled={!onDelete}
          style={[styles.headerIconBtn, !onDelete && { opacity: 0 }]}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Main Card */}
        <GlassView style={styles.glassCard} intensity={80} borderRadius={24} backgroundColor="rgba(255,255,255,0.6)" borderColor="rgba(255,255,255,0.9)" borderWidth={1.5}>
          <View style={styles.mainCardRow}>
            <View style={styles.cardImageWrapper}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.cardImage} />
              ) : (
                <Ionicons name="image-outline" size={40} color={riskColor} />
              )}
            </View>

            <View style={styles.mainCardContent}>
              <View style={styles.titleRow}>
                <Text style={styles.conditionTitle} numberOfLines={1}>
                  {info.label.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <Ionicons name={titleIcon as any} size={20} color={riskColor} />
              </View>

              <Text style={styles.dateText}>{dateStr}</Text>

              <Text style={styles.confLabel}>Confidence Score</Text>
              <Text style={styles.confScore}>{confPct}%</Text>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${confPct}%` }]} />
              </View>
            </View>
          </View>
          {hasROI && (
            <>
              <View style={styles.divider} />
              <Pressable
                style={({ pressed }) => [
                  styles.viewDetectionBtn,
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => setShowDetectionModal(true)}
              >
                <Ionicons name="scan-outline" size={18} color="#006DFF" />
                <Text style={styles.viewDetectionText}>View AI Focus & Bounding Box</Text>
                <Ionicons name="chevron-forward" size={16} color="#006DFF" />
              </Pressable>
            </>
          )}
        </GlassView>



        {/* Hide Analysis Details if Unidentified */}
        {!isUnidentified && (
          <GlassView style={styles.glassCard} intensity={80} borderRadius={24} backgroundColor="rgba(255,255,255,0.6)" borderColor="rgba(255,255,255,0.9)" borderWidth={1.5}>
            <Text style={styles.sectionHeading}>Analysis Details</Text>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Shape</Text>
              <Text style={styles.detailText}>{info.shapeDetail || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Color</Text>
              <Text style={styles.detailText}>{info.colorDetail || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Texture</Text>
              <Text style={styles.detailText}>{info.textureDetail || 'N/A'}</Text>
            </View>
          </GlassView>
        )}

        {/* Additional Information / Guidance */}
        <GlassView style={styles.glassCard} intensity={80} borderRadius={24} backgroundColor="rgba(255,255,255,0.6)" borderColor="rgba(255,255,255,0.9)" borderWidth={1.5}>
          <Text style={styles.sectionHeading}>{isUnidentified ? 'Guidance' : 'Additional Information'}</Text>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{isUnidentified ? 'Why did this happen?' : 'Additional Findings'}</Text>
            <Text style={styles.detailText}>{info.description}</Text>
          </View>

          {!isUnidentified && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Causes</Text>
                {info.causes.length > 0 ? info.causes.map((cause, i) => (
                  <Text key={i} style={styles.detailText}>• {cause}</Text>
                )) : <Text style={styles.detailText}>Unknown</Text>}
              </View>
            </>
          )}

          {info.validatedSource && !isUnidentified && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Validated Source</Text>
                <Text style={styles.detailText}>{info.validatedSource}</Text>
              </View>
            </>
          )}
        </GlassView>

        {/* Treatment / Care (Hidden for Unidentified) */}
        {!isUnidentified && (
          <View style={styles.expandableWrapper}>
            <Pressable onPress={() => setTreatmentExpanded(!treatmentExpanded)}>
              <GlassView style={styles.actionCard} intensity={80} borderRadius={24} backgroundColor="rgba(255,255,255,0.6)" borderColor="rgba(255,255,255,0.9)" borderWidth={1.5}>
                <View style={styles.actionIconBox}>
                  <Ionicons name="medical-outline" size={20} color="#006DFF" />
                </View>
                <Text style={styles.actionText}>Treatment / Care</Text>
                <Ionicons name={treatmentExpanded ? "chevron-up" : "chevron-forward"} size={20} color="#90B2E4" />
              </GlassView>
            </Pressable>
            {treatmentExpanded && (
              <Animated.View style={styles.expandableContent}>
                <GlassView style={styles.expandableCard} intensity={60} borderRadius={18} backgroundColor="rgba(255,255,255,0.4)" borderColor="rgba(255,255,255,0.6)" borderWidth={1}>
                  {info.treatment.length > 0 ? info.treatment.map((t, i) => (
                    <Text key={i} style={styles.expandableDetailText}>• {t}</Text>
                  )) : (
                    <Text style={styles.expandableDetailText}>No specific treatment guidelines available.</Text>
                  )}
                </GlassView>
              </Animated.View>
            )}
          </View>
        )}

        {/* Recommendations / Tips */}
        <View style={styles.expandableWrapper}>
          <Pressable onPress={() => setRecsExpanded(!recsExpanded)}>
            <GlassView style={styles.actionCard} intensity={80} borderRadius={24} backgroundColor="rgba(255,255,255,0.6)" borderColor="rgba(255,255,255,0.9)" borderWidth={1.5}>
              <View style={styles.actionIconBox}>
                <Ionicons name={isUnidentified ? "camera-outline" : "shield-checkmark-outline"} size={20} color="#006DFF" />
              </View>
              <Text style={styles.actionText}>{isUnidentified ? 'Tips for a Better Scan' : 'Recommendations'}</Text>
              <Ionicons name={recsExpanded ? "chevron-up" : "chevron-forward"} size={20} color="#90B2E4" />
            </GlassView>
          </Pressable>
          {recsExpanded && (
            <Animated.View style={styles.expandableContent}>
              <GlassView style={styles.expandableCard} intensity={60} borderRadius={18} backgroundColor="rgba(255,255,255,0.4)" borderColor="rgba(255,255,255,0.6)" borderWidth={1}>
                {info.recommendations && info.recommendations.length > 0 ? info.recommendations.map((r, i) => (
                  <Text key={i} style={styles.expandableDetailText}>• {r}</Text>
                )) : (
                  <Text style={styles.expandableDetailText}>No recommendations available.</Text>
                )}
                {isUnidentified && info.treatment.length > 0 && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.expandableDetailText}>• {info.treatment[0]}</Text>
                  </>
                )}
              </GlassView>
            </Animated.View>
          )}
        </View>

        {/* Confidence Explanation */}
        <View style={styles.expandableWrapper}>
          <Pressable onPress={() => setConfidenceExpanded(!confidenceExpanded)}>
            <GlassView style={styles.actionCard} intensity={80} borderRadius={24} backgroundColor="rgba(255,255,255,0.6)" borderColor="rgba(255,255,255,0.9)" borderWidth={1.5}>
              <View style={styles.actionIconBox}>
                <Ionicons name="analytics-outline" size={20} color="#006DFF" />
              </View>
              <Text style={styles.actionText}>Confidence Breakdown</Text>
              <Ionicons name={confidenceExpanded ? "chevron-up" : "chevron-forward"} size={20} color="#90B2E4" />
            </GlassView>
          </Pressable>
          {confidenceExpanded && (
            <Animated.View style={styles.expandableContent}>
              <GlassView style={styles.expandableCard} intensity={60} borderRadius={18} backgroundColor="rgba(255,255,255,0.4)" borderColor="rgba(255,255,255,0.6)" borderWidth={1}>
                <Text style={[styles.expandableDetailText, { marginBottom: 12, fontWeight: '800' }]}>
                  How is this calculated?
                </Text>
                <Text style={[styles.expandableDetailText, { fontWeight: '600', marginBottom: 12 }]}>
                  The final confidence score combines the AI model's certainty with the physical quality of the camera photo (sharpness, lighting, and framing).
                </Text>

                {label !== 'unidentified' && (
                  <>
                    <View style={[styles.divider, { marginVertical: 8 }]} />
                    <Text style={[styles.expandableDetailText, { fontWeight: '800', marginBottom: 6 }]}>
                      How the AI Thinks:
                    </Text>
                    <Text style={[styles.expandableDetailText, { fontWeight: '600', color: '#4F668F' }]}>
                      {label === 'clubbing' && "The AI detected a bulbous nail tip with an increased Lovibond angle (greater than 180°), a strong structural indicator of nail clubbing."}
                      {label === 'beau_lines' && "The AI detected significant horizontal physical ridges across the nail plate."}
                      {label === 'muehrckes_lines' && "The AI detected paired, horizontal white lines that run parallel to the lunula."}
                      {label === 'blue_finger' && "The AI analyzed the color gradient and detected an abnormally low Red-to-Blue light ratio (R/B < 0.95), indicating cyanosis."}
                      {label === 'koilonychia' && "The AI detected a concave, spoon-like structural deformation."}
                      {label === 'pitting' && "The AI detected multiple small, scattered depressions or physical pits on the nail surface."}
                      {label === 'acral_lentiginous_melanoma' && "The AI detected a dark longitudinal pigmented band typical of subungual melanoma."}
                      {label === 'healthy_nails' && "The AI detected smooth physical geometry and normal color gradients, with no structural anomalies."}
                    </Text>
                  </>
                )}

                {qualityFlags && qualityFlags.length > 0 && (
                  <>
                    <View style={styles.divider} />
                    <Text style={[styles.expandableDetailText, { fontWeight: '800', marginBottom: 8 }]}>
                      Your confidence score was lowered due to poor image quality:
                    </Text>
                    {qualityFlags.map((flag, i) => (
                      <View key={i} style={{ flexDirection: 'row', marginBottom: 6, paddingRight: 10 }}>
                        <Text style={[styles.expandableDetailText, { fontWeight: '900', marginRight: 6 }]}>•</Text>
                        <Text style={[styles.expandableDetailText, { flex: 1 }]}>{flag}</Text>
                      </View>
                    ))}
                  </>
                )}

                {(!qualityFlags || qualityFlags.length === 0) && (
                  <>
                    <View style={styles.divider} />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="checkmark-circle" size={16} color="#159947" style={{ marginRight: 6 }} />
                      <Text style={[styles.expandableDetailText, { marginBottom: 0, fontWeight: '700', color: '#159947' }]}>
                        Excellent image quality detected.
                      </Text>
                    </View>
                  </>
                )}
              </GlassView>
            </Animated.View>
          )}
        </View>

      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtonsWrapper}>
        <View style={styles.bottomButtons}>
          <Pressable style={styles.scanAgainBtn} onPress={onScanAgain}>
            <Text style={styles.scanAgainText}>Scan Again</Text>
          </Pressable>

          <Pressable style={styles.exitBtn} onPress={onDone}>
            <Text style={styles.exitText}>Exit</Text>
          </Pressable>
        </View>
      </View>

      {/* AI Bounding Box Detection Modal */}
      <Modal
        visible={showDetectionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetectionModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDetectionModal(false)} />
          <Animated.View style={styles.modalWrapper}>
            <GlassView
              style={styles.modalCard}
              intensity={95}
              borderRadius={28}
              backgroundColor="rgba(255, 255, 255, 0.9)"
              borderColor="rgba(255, 255, 255, 1)"
              borderWidth={2}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <View style={styles.modalIndicator} />
                  <Text style={styles.modalTitle}>AI Nail Focus Area</Text>
                </View>
                <Pressable onPress={() => setShowDetectionModal(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={20} color="#0B2E6F" />
                </Pressable>
              </View>

              {/* Modal Description */}
              <Text style={styles.modalDescription}>
                This visualization displays the original camera capture. The blue highlight represents the exact region isolated by the pre-processing pipeline for classification.
              </Text>

              {/* Image Container with Absolute Bounding Box */}
              <View style={styles.modalImageWrapper}>
                <View style={[styles.modalImageContainer, { width: displayWidth, height: displayHeight }]}>
                  {originalImageUri && (
                    <Image
                      source={{ uri: originalImageUri }}
                      style={{ width: displayWidth, height: displayHeight, borderRadius: 16 }}
                      resizeMode="contain"
                    />
                  )}

                  {/* Neon Bounding Box */}
                  <View style={boxStyle}>
                    {/* Top-Left Bracket */}
                    <View style={[styles.cornerBracket, { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3 }]} />
                    {/* Top-Right Bracket */}
                    <View style={[styles.cornerBracket, { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3 }]} />
                    {/* Bottom-Left Bracket */}
                    <View style={[styles.cornerBracket, { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
                    {/* Bottom-Right Bracket */}
                    <View style={[styles.cornerBracket, { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3 }]} />

                    {/* Glowing AI Label */}
                    <View style={styles.boxLabel}>
                      <Ionicons name="scan" size={9} color="#00E5FF" style={{ marginRight: 3 }} />
                      <Text style={styles.boxLabelText}>AI FOCUS PLATE</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Metrics / Details */}
              <View style={styles.modalMetricsContainer}>
                <View style={styles.metricRow}>
                  <Ionicons name="resize-outline" size={14} color="#64789A" />
                  <Text style={styles.metricLabel}>Target Resolution:</Text>
                  <Text style={styles.metricValue}>{imgWidth} × {imgHeight}px</Text>
                </View>
                <View style={styles.metricRow}>
                  <Ionicons name="crop-outline" size={14} color="#64789A" />
                  <Text style={styles.metricLabel}>Focus Box Size:</Text>
                  <Text style={styles.metricValue}>{rw} × {rh}px</Text>
                </View>
                <View style={styles.metricRow}>
                  <Ionicons name="analytics-outline" size={14} color="#64789A" />
                  <Text style={styles.metricLabel}>Method:</Text>
                  <Text style={styles.metricValue}>Otsu Threshold & Contour</Text>
                </View>
              </View>

              {/* Action Button to Dismiss */}
              <Pressable style={styles.modalDismissBtn} onPress={() => setShowDetectionModal(false)}>
                <Text style={styles.modalDismissText}>Got it</Text>
              </Pressable>
            </GlassView>
          </Animated.View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 78,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#071F55',
    fontSize: 26,
    fontWeight: '900',
    marginLeft: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
  },
  glassCard: {
    padding: 18,
    marginBottom: 16,
  },
  mainCardRow: {
    flexDirection: 'row',
  },
  cardImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#E9F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mainCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conditionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#071F55',
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64789A',
    marginTop: 2,
    marginBottom: 8,
  },
  confLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2A5599',
  },
  confScore: {
    fontSize: 34,
    fontWeight: '900',
    color: '#006DFF',
    lineHeight: 40,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(0,109,255,0.15)',
    borderRadius: 3,
    marginTop: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#006DFF',
    borderRadius: 3,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#006DFF',
    marginBottom: 16,
  },
  detailItem: {
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2A5599',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#071F55',
    lineHeight: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskLevelText: {
    fontSize: 15,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginVertical: 14,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#4F668F',
  },
  bottomButtonsWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: 'rgba(234,242,255,0.85)',
  },
  bottomButtons: {
    flexDirection: 'row',
  },
  scanAgainBtn: {
    flex: 1,
    height: 56,
    backgroundColor: '#006DFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  scanAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  exitBtn: {
    flex: 1,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  exitText: {
    color: '#006DFF',
    fontSize: 16,
    fontWeight: '800',
  },
  expandableWrapper: {
    marginBottom: 12,
  },
  expandableContent: {
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  expandableCard: {
    padding: 16,
  },
  expandableDetailText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#071F55',
    lineHeight: 22,
    marginBottom: 6,
  },
  sourceCard: {
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2A5599',
  },
  sourceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#071F55',
    lineHeight: 20,
  },
  viewDetectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  viewDetectionText: {
    flex: 1,
    color: '#006DFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 31, 85, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 360,
  },
  modalCard: {
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#006DFF',
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#071F55',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDescription: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F668F',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalImageWrapper: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 109, 255, 0.1)',
    marginBottom: 16,
  },
  modalImageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#071F55',
    position: 'relative',
  },
  cornerBracket: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: '#00E5FF',
  },
  boxLabel: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(7, 31, 85, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)',
  },
  boxLabelText: {
    color: '#00E5FF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalMetricsContainer: {
    width: '100%',
    backgroundColor: 'rgba(0, 109, 255, 0.04)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64789A',
    marginLeft: 8,
    flex: 1,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#071F55',
  },
  modalDismissBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#006DFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#006DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  modalDismissText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
});
