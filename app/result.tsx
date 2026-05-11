import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, View, Pressable, Alert, SafeAreaView, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


import { getConditionInfo } from '@/data/diagnosis';
import { moderateScale, scale, verticalScale, scaleFont } from '@/utils/ui';
import { deleteScanHistoryEntry } from '@/services/scan-history';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    id?: string;
    label: string; 
    confidence: string; 
    imageUri: string;
    timestamp?: string;
  }>();
  
  const id = params.id;
  const label = params.label || 'Healthy';
  const confidence = parseFloat(params.confidence || '0.95');
  const confidencePct = Math.round(confidence * 100);
  const imageUri = params.imageUri;
  const timestamp = params.timestamp ? parseInt(params.timestamp) : Date.now();
  
  const info = getConditionInfo(label);

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
  let titleIcon = isHealthy ? 'checkmark-circle' : 'warning';
  let titleIconColor = isHealthy ? '#159947' : '#FF9500';
  
  if (isHealthy) {
    riskColor = '#159947';
  } else if (isUnidentified) {
    riskColor = '#7A8797';
    titleIconColor = '#7A8797';
  } else if (info.riskLevel.toLowerCase() === 'high') {
    riskColor = '#D71920';
  }

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete Scan?',
      'This scan result will be removed from your history.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteScanHistoryEntry(id);
            router.back();
          }
        }
      ]
    );
  };

  const formattedDate = new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

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
          <Animated.View style={[styles.mainScroll, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back-outline" size={24} color="#071F55" />
          </Pressable>
          <Text style={styles.headerTitle}>Scan Details</Text>
          <View style={styles.headerBtn}>
            {id ? (
              <Pressable onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              </Pressable>
            ) : (
              <View style={{ width: 24, height: 24 }} />
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Summary Card */}
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <View style={styles.imageBox}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.image} />
                ) : (
                  <Ionicons name="finger-print" size={42} color={titleIconColor} />
                )}
              </View>
              <View style={styles.summaryTextCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.conditionTitle} numberOfLines={1}>{label.replace(' Nail', '')}</Text>
                  <Ionicons name={titleIcon as any} size={20} color={titleIconColor} />
                </View>
                <Text style={styles.dateText}>{formattedDate}</Text>
                <Text style={styles.confLabel}>Confidence Score</Text>
                <Text style={styles.confValue}>{confidencePct}%</Text>
                
                {/* Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${confidencePct}%` }]} />
                </View>
              </View>
            </View>
          </View>

          {/* Analysis Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Analysis Details</Text>
            
            <View style={styles.analysisRow}>
              <Text style={styles.rowLabel}>Shape</Text>
              <Text style={styles.rowValue}>{info.shapeDetail}</Text>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.analysisRow}>
              <Text style={styles.rowLabel}>Color</Text>
              <Text style={styles.rowValue}>{info.colorDetail}</Text>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.analysisRow}>
              <Text style={styles.rowLabel}>Texture</Text>
              <Text style={styles.rowValue}>{info.textureDetail}</Text>
            </View>
          </View>

          {/* Additional Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Additional Information</Text>
            <View style={styles.kvRow}>
              <Text style={styles.rowLabel}>Risk Level</Text>
              <Text style={[styles.riskValue, { color: '#071F55' }]}>{info.riskLevel}</Text>
            </View>
          </View>

          {/* Recommendations */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recommendations</Text>
            {info.treatment.map((rec: string, i: number) => (
              <View key={i} style={styles.bulletRow}>
                <Ionicons name="shield-checkmark-outline" size={17} color="#006DFF" />
                <Text style={styles.bulletText}>{rec}</Text>
              </View>
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <Pressable 
              style={({ pressed }) => [styles.btn, styles.btnSolid, pressed && { opacity: 0.85 }]} 
              onPress={() => router.push('/capture')}
            >
              <Text style={styles.btnSolidText}>Scan Again</Text>
            </Pressable>
            <Pressable 
              style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && { backgroundColor: '#F0F4F8' }]} 
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.btnOutlineText}>Exit</Text>
            </Pressable>
          </View>
          
          <View style={styles.spacer} />
          </ScrollView>
        </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  mainScroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: verticalScale(60),
    paddingHorizontal: scale(16),
  },
  headerBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#071F55',
    fontSize: scaleFont(17),
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(30),
    paddingTop: verticalScale(10),
    gap: verticalScale(14),
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: scale(16),
    borderWidth: 1,
    borderColor: '#E1E8F0',
    shadowColor: '#A0B4C8',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  imageBox: {
    width: moderateScale(86),
    height: verticalScale(106),
    backgroundColor: '#F4F7FB',
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  summaryTextCol: {
    flex: 1,
    marginLeft: scale(14),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conditionTitle: {
    flex: 1,
    fontSize: scaleFont(19),
    fontWeight: '900',
    color: '#071F55',
    marginRight: scale(6),
  },
  dateText: {
    fontSize: scaleFont(11),
    fontWeight: '600',
    color: '#7A8797',
    marginTop: verticalScale(2),
  },
  confLabel: {
    fontSize: scaleFont(12),
    fontWeight: '800',
    color: '#4F668F',
    marginTop: verticalScale(14),
  },
  confValue: {
    fontSize: scaleFont(24),
    fontWeight: '900',
    color: '#006DFF',
    marginTop: verticalScale(-2),
  },
  progressBarTrack: {
    width: '100%',
    height: verticalScale(6),
    backgroundColor: '#E1E8F0',
    borderRadius: moderateScale(3),
    marginTop: verticalScale(4),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#006DFF',
    borderRadius: moderateScale(3),
  },
  cardTitle: {
    fontSize: scaleFont(15),
    fontWeight: '900',
    color: '#006DFF',
    marginBottom: verticalScale(12),
  },
  analysisRow: {
    marginBottom: verticalScale(10),
  },
  rowLabel: {
    fontSize: scaleFont(12.5),
    fontWeight: '900',
    color: '#071F55',
    marginBottom: verticalScale(4),
  },
  rowValue: {
    fontSize: scaleFont(13.5),
    fontWeight: '700',
    color: '#3F5F8F',
  },
  divider: {
    height: 1,
    backgroundColor: '#E1E8F0',
    marginBottom: verticalScale(10),
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  riskValue: {
    fontSize: scaleFont(13.5),
    fontWeight: '900',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(10),
  },
  bulletText: {
    flex: 1,
    fontSize: scaleFont(13),
    fontWeight: '700',
    color: '#071F55',
    marginLeft: scale(10),
    lineHeight: verticalScale(18),
  },
  spacer: {
    height: verticalScale(10),
  },
  btnRow: {
    flexDirection: 'row',
    gap: scale(12),
    marginTop: verticalScale(4),
  },
  btn: {
    flex: 1,
    height: moderateScale(54),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSolid: {
    backgroundColor: '#006DFF',
  },
  btnSolidText: {
    color: 'white',
    fontSize: scaleFont(15.5),
    fontWeight: '900',
  },
  btnOutline: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#E1E8F0',
  },
  btnOutlineText: {
    color: '#006DFF',
    fontSize: scaleFont(15.5),
    fontWeight: '900',
  },
});
