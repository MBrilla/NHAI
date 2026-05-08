import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/nailscan/screen-shell';
import { GlassView } from '@/components/nailscan/glass-view';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export default function CaptureScreen() {
  const router = useRouter();
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
      <ScreenShell>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>We need your permission to show the camera</Text>
          <Pressable onPress={requestPermission} style={styles.permissionBtn}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </Pressable>
        </View>
      </ScreenShell>
    );
  }

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          setCapturedImage(photo.uri);
        }
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
        setCapturedImage(result.assets[0].uri);
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

  return (
    <ScreenShell variant="default">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerIconBtn}>
            <Ionicons name="chevron-back" size={20} color="#0B2E6F" />
          </Pressable>
          <Text style={styles.headerTitle}>Nail Capture</Text>
        </View>

        {/* Tips Card */}
        <GlassView style={styles.tipsCard} intensity={62}>
          <View style={styles.tipsHeader}>
            <Ionicons name="sparkles" size={20} color="#086BFF" />
            <Text style={styles.tipsTitle}>For better scan results:</Text>
          </View>
          <View style={styles.tipsRow}>
            <TipItem icon="contract" label={"Center\nthe nail"} />
            <View style={styles.divider} />
            <TipItem icon="sunny" label={"Use even\nlighting"} />
            <View style={styles.divider} />
            <TipItem icon="eye" label={"Clearly\nvisible"} />
            <View style={styles.divider} />
            <TipItem icon="hand-right" label={"Hold still\n1 sec"} />
          </View>
        </GlassView>

        {/* Camera Preview */}
        <View style={styles.previewContainer}>
          <GlassView style={styles.previewBorder} intensity={16}>
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
                      // Manual refocus on tap
                      setAutoFocus('off');
                      setTimeout(() => setAutoFocus('on'), 100);
                    }}
                  >
                    <View style={styles.guideFrame} />
                    <View style={styles.guideInstructionBox}>
                      <Text style={styles.guideInstructionText}>Place one nail inside this guide</Text>
                    </View>
                    
                    <View style={styles.cameraControls}>
                      <Pressable 
                        style={styles.controlBtn} 
                        onPress={(e) => {
                          e.stopPropagation();
                          setFlashEnabled(!flashEnabled);
                        }}
                      >
                        <Ionicons 
                          name={flashEnabled ? "flash" : "flash-off"} 
                          size={24} 
                          color="white" 
                        />
                        <Text style={styles.controlBtnText}>Flash</Text>
                      </Pressable>
                    </View>
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
            <Ionicons 
              name={capturedImage ? "analytics" : "camera"} 
              size={24} 
              color="white" 
            />
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>{capturedImage ? 'Analyze Image' : 'Take Photo'}</Text>
              <Text style={styles.actionSubtitle}>{capturedImage ? 'Analyze now' : 'Capture now'}</Text>
            </View>
          </Pressable>

          <Pressable 
            style={[styles.actionBtn, styles.secondaryBtn]} 
            onPress={capturedImage ? () => setCapturedImage(null) : handleUploadImage}
          >
            <Ionicons 
              name={capturedImage ? "refresh" : "cloud-upload"} 
              size={24} 
              color="#0B2E6F" 
            />
            <View style={styles.actionTextCol}>
              <Text style={[styles.actionTitle, { color: '#0B2E6F' }]}>{capturedImage ? 'Retake' : 'Upload'}</Text>
              <Text style={[styles.actionSubtitle, { color: '#4667A0' }]}>{capturedImage ? 'Capture again' : 'Choose photo'}</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </ScreenShell>
  );
}

function TipItem({ icon, label }: { icon: any, label: string }) {
  return (
    <View style={styles.tipItem}>
      <View style={styles.tipIconBox}>
        <Ionicons name={icon} size={20} color="#086BFF" />
      </View>
      <Text style={styles.tipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    height: 52,
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
    flex: 1,
    fontSize: 21,
    fontWeight: '900',
    color: '#071F55',
    textAlign: 'center',
    marginRight: 42,
    letterSpacing: -0.5,
  },
  tipsCard: {
    marginTop: 10,
    padding: 12,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#086BFF',
    marginLeft: 8,
  },
  tipsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  },
  tipLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#071F55',
    textAlign: 'center',
    marginTop: 6,
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(185, 217, 255, 0.5)',
  },
  previewContainer: {
    flex: 1,
    marginVertical: 10,
  },
  previewBorder: {
    flex: 1,
    padding: 4,
  },
  cameraBox: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: '45%',
    height: '65%',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 100,
  },
  guideInstructionBox: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(28, 45, 74, 0.78)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  guideInstructionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  cameraControls: {
    position: 'absolute',
    top: 20,
    right: 15,
    gap: 15,
  },
  controlBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(28, 45, 74, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlBtnText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  capturedImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  primaryBtn: {
    backgroundColor: '#0B5CFF',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  actionTextCol: {
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: 'white',
  },
  actionSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
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
