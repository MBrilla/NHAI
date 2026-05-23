import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View, useWindowDimensions, SafeAreaView, StatusBar, Platform } from 'react-native';

import { GlassView } from '@/components/nailscan/glass-view';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { moderateScale, scale, verticalScale, scaleFont } from '@/utils/ui';

export default function CaptureScreen() {
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [autoFocus, setAutoFocus] = useState<'on' | 'off'>('on');

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <ImageBackground 
        source={require('@/assets/images/background.png')}
        style={styles.container}
        resizeMode="cover"
        imageStyle={{ opacity: 0.8 }}
      >
        <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 0 }}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>We need your permission to show the camera</Text>
            <Pressable onPress={requestPermission} style={styles.permissionBtn}>
              <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.92, skipProcessing: false });
        if (!photo?.uri) return;

        // Perform loose center-square crop to preserve aspect ratio without static digital zoom
        const minDim = Math.min(photo.width, photo.height);
        const originX = Math.round((photo.width - minDim) / 2);
        const originY = Math.round((photo.height - minDim) / 2);

        const cropped = await manipulateAsync(
          photo.uri,
          [
            { crop: { originX, originY, width: minDim, height: minDim } }
          ],
          { compress: 0.95, format: SaveFormat.JPEG }
        );

        setCapturedImage(cropped.uri);
      } catch (err) {
        console.error("Capture error:", err);
      }
    }
  };

  const handleUploadImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Center crop to high-resolution square
        const minDim = Math.min(asset.width, asset.height);
        const originX = Math.round((asset.width - minDim) / 2);
        const originY = Math.round((asset.height - minDim) / 2);

        const cropped = await manipulateAsync(
          asset.uri,
          [
            { crop: { originX, originY, width: minDim, height: minDim } }
          ],
          { compress: 0.95, format: SaveFormat.JPEG }
        );

        setCapturedImage(cropped.uri);
      }
    } catch (err) {
      console.error("Picker error:", err);
    }
  };

  const handleAnalyze = () => {
    if (capturedImage) {
      router.push({
        pathname: '/processing',
        params: { imageUri: capturedImage },
      });
    }
  };

  const isTallScreen = screenHeight > 800;

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
            <Pressable onPress={() => router.back()} style={styles.headerIconBtn}>
              <Ionicons name="chevron-back" size={20} color="#06245C" />
            </Pressable>
            <Text style={styles.headerTitle}>Nail Capture</Text>
          </View>

          {/* Tips Card */}
          <GlassView
            style={styles.tipsCard}
            intensity={40}
            borderRadius={20}
            backgroundColor="rgba(255,255,255,0.62)"
            borderColor="rgba(255,255,255,0.9)"
            borderWidth={1.4}
          >
            <View style={styles.tipsHeader}>
              <Ionicons name="sparkles" size={18} color="#086BFF" />
              <Text style={styles.tipsTitle}>For better scan results:</Text>
            </View>
            <View style={styles.tipsRow}>
              <TipItem icon="scan" label="Center\nthe nail" />
              <View style={styles.tipsDivider} />
              <TipItem icon="sunny-outline" label="Use even\nlighting" />
              <View style={styles.tipsDivider} />
              <TipItem icon="eye-outline" label="Keep nail\nclearly visible" />
              <View style={styles.tipsDivider} />
              <TipItem icon="hand-left-outline" label="Hold still for\n1 second" />
            </View>
          </GlassView>

          {/* Camera Preview */}
          <View style={[styles.previewContainer, !isTallScreen && { marginVertical: 6 }]}>
            <GlassView 
              style={styles.previewBorder} 
              intensity={16} 
              borderRadius={24}
              backgroundColor="rgba(255,255,255,0.16)"
              borderColor="rgba(255,255,255,0.9)"
              borderWidth={1.8}
            >
              <View style={styles.cameraBox}>
                {!capturedImage ? (
                  <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    enableTorch={flashEnabled}
                    autofocus={autoFocus}
                  >
                    <Pressable 
                      style={styles.overlay} 
                      onPress={() => {
                        setAutoFocus('off');
                        setTimeout(() => setAutoFocus('on'), 100);
                      }}
                    >
                      {/* Corner Guides */}
                      <CornerGuides />
                      
                      <View style={styles.guideFrame} />
                      
                      <View style={styles.guideInstructionBox}>
                        <Text style={styles.guideInstructionText}>Place one nail inside this guide</Text>
                      </View>
                      
                      <Pressable 
                        style={styles.flashBtn} 
                        onPress={(e) => {
                          e.stopPropagation();
                          setFlashEnabled(!flashEnabled);
                        }}
                      >
                        <Ionicons 
                          name={flashEnabled ? "flash" : "flash-off"} 
                          size={28} 
                          color="white"
                          style={styles.flashIconShadow}
                        />
                      </Pressable>
                    </Pressable>
                  </CameraView>
                ) : (
                  <View style={StyleSheet.absoluteFill}>
                    <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
                    <View style={styles.overlay}>
                      <View style={styles.guideFrame} />
                    </View>
                  </View>
                )}
              </View>
            </GlassView>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable 
              style={[styles.actionBtn, styles.primaryBtn]} 
              onPress={capturedImage ? handleAnalyze : handleTakePhoto}
            >
              <LinearGradient
                colors={['#29A8FF', '#006DFF', '#0051D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.actionBtnContent}>
                <Ionicons 
                  name={capturedImage ? "analytics" : "camera"} 
                  size={22} 
                  color="white" 
                />
                <View style={styles.actionTextCol}>
                  <Text style={styles.actionTitle}>{capturedImage ? 'Analyze Image' : 'Take Photo'}</Text>
                  <Text style={styles.actionSubtitle}>{capturedImage ? 'Analyze now' : 'Capture now'}</Text>
                </View>
              </View>
            </Pressable>

            <Pressable 
              style={[styles.actionBtn, styles.secondaryBtn]} 
              onPress={capturedImage ? () => setCapturedImage(null) : handleUploadImage}
            >
              <View style={styles.actionBtnContent}>
                <Ionicons 
                  name={capturedImage ? "refresh" : "cloud-upload-outline"} 
                  size={22} 
                  color="#086BFF" 
                />
                <View style={styles.actionTextCol}>
                  <Text style={[styles.actionTitle, { color: '#086BFF' }]}>{capturedImage ? 'Retake Photo' : 'Upload'}</Text>
                  <Text style={[styles.actionSubtitle, { color: '#627493' }]}>{capturedImage ? 'Capture again' : 'Choose photo'}</Text>
                </View>
              </View>
            </Pressable>
          </View>
          
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function TipItem({ icon, label }: { icon: any, label: string }) {
  return (
    <View style={styles.tipItem}>
      <View style={styles.tipIconBox}>
        <Ionicons name={icon} size={18} color="#086BFF" />
      </View>
      <Text style={styles.tipLabel}>{label.replace('\\n', '\n')}</Text>
    </View>
  );
}

function CornerGuides() {
  return (
    <>
      <View style={[styles.cornerBracket, styles.topLeftHorizontal]} />
      <View style={[styles.cornerBracket, styles.topLeftVertical]} />
      <View style={[styles.cornerBracket, styles.topRightHorizontal]} />
      <View style={[styles.cornerBracket, styles.topRightVertical]} />
      <View style={[styles.cornerBracket, styles.bottomLeftHorizontal]} />
      <View style={[styles.cornerBracket, styles.bottomLeftVertical]} />
      <View style={[styles.cornerBracket, styles.bottomRightHorizontal]} />
      <View style={[styles.cornerBracket, styles.bottomRightVertical]} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2FF',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    marginBottom: 6,
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
    position: 'absolute',
    left: 0,
    zIndex: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 21,
    fontWeight: '900',
    color: '#071F55',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tipsCard: {
    padding: 12,
    marginBottom: 6,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#086BFF',
    marginLeft: 8,
  },
  tipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipItem: {
    flex: 1,
    alignItems: 'center',
  },
  tipIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(232, 243, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipLabel: {
    fontSize: 10.2,
    fontWeight: '800',
    color: '#071F55',
    textAlign: 'center',
    lineHeight: 11,
  },
  tipsDivider: {
    width: 1.4,
    height: 60,
    backgroundColor: 'rgba(185, 217, 255, 0.9)',
    marginHorizontal: 4,
  },
  previewContainer: {
    flex: 1,
    marginBottom: 6,
  },
  previewBorder: {
    flex: 1,
    shadowColor: '#006CFF',
    shadowOpacity: 0.16,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  cameraBox: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerBracket: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 2.5,
  },
  topLeftHorizontal: { top: 20, left: 20, width: 34, height: 5 },
  topLeftVertical: { top: 20, left: 20, width: 5, height: 34 },
  topRightHorizontal: { top: 20, right: 20, width: 34, height: 5 },
  topRightVertical: { top: 20, right: 20, width: 5, height: 34 },
  bottomLeftHorizontal: { bottom: 20, left: 20, width: 34, height: 5 },
  bottomLeftVertical: { bottom: 20, left: 20, width: 5, height: 34 },
  bottomRightHorizontal: { bottom: 20, right: 20, width: 34, height: 5 },
  bottomRightVertical: { bottom: 20, right: 20, width: 5, height: 34 },
  guideFrame: {
    width: '28%',
    height: '46%',
    borderWidth: 3.8,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 100,
  },
  guideInstructionBox: {
    position: 'absolute',
    bottom: 34,
    backgroundColor: 'rgba(28, 45, 74, 0.78)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  guideInstructionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  flashBtn: {
    position: 'absolute',
    top: 24,
    right: 28,
    padding: 10,
  },
  flashIconShadow: {
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  capturedImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    height: 58,
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionBtnContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  primaryBtn: {
    backgroundColor: '#006DFF',
    shadowColor: '#006DFF',
    shadowOpacity: 0.34,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.4,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#006DFF',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  actionTextCol: {
    marginLeft: 7,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 13.6,
    fontWeight: '900',
    color: 'white',
  },
  actionSubtitle: {
    fontSize: 10.2,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.86)',
    marginTop: 2,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#071F55',
  },
  permissionBtn: {
    backgroundColor: '#0B5CFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: 'white',
    fontWeight: '700',
  },
});


