import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';

interface GlassViewProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderRadius?: number;
  borderColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
}

export function GlassView({
  children,
  style,
  intensity = 50,
  borderRadius = 32,
  borderColor = 'rgba(255, 255, 255, 0.72)',
  backgroundColor = 'rgba(255, 255, 255, 0.34)',
  borderWidth = 1.6,
}: GlassViewProps) {
  const isAndroid = Platform.OS === 'android';

  // Android doesn't support BlurView intensity the same way as iOS, 
  // so we use a semi-transparent background as a fallback or in addition.
  
  return (
    <View style={[styles.container, { borderRadius, overflow: 'hidden' }, style]}>
      <BlurView intensity={intensity} style={StyleSheet.absoluteFill} tint="light" />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor,
            borderRadius,
            borderWidth,
            borderColor,
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Basic container styles
  },
});
