import { StyleSheet, View, ViewStyle } from 'react-native';

interface SoftCircleProps {
  size: number;
  color?: string;
  opacity?: number;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
}

export function SoftCircle({
  size,
  color = '#0B5CFF',
  opacity = 0.2,
  top,
  left,
  right,
  bottom,
}: SoftCircleProps) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: opacity,
          top: top as any,
          left: left as any,
          right: right as any,
          bottom: bottom as any,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    // We rely on shadow/blur for the "soft" effect if needed, 
    // but in Flutter it was a radial gradient.
    // For React Native, we can use a large blur radius or just opacity.
  },
});
