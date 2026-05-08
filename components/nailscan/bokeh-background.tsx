import { StyleSheet, View } from 'react-native';

export function BokehBackground() {
  const dots = [
    { x: '8%', y: '13%', size: 30, opacity: 0.14 },
    { x: '73%', y: '18%', size: 42, opacity: 0.14 },
    { x: '92%', y: '8%', size: 24, opacity: 0.18 },
    { x: '20%', y: '55%', size: 20, opacity: 0.12 },
    { x: '82%', y: '61%', size: 40, opacity: 0.12 },
    { x: '48%', y: '86%', size: 26, opacity: 0.12 },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map((dot, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              left: dot.x as any,
              top: dot.y as any,
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size / 2,
              opacity: dot.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    backgroundColor: 'white',
    // In RN, we can't easily do MaskFilter.blur on a View without a library,
    // but we can use shadowRadius or just keep it semi-transparent.
    // For true bokeh, we'd want blur.
    shadowColor: 'white',
    shadowRadius: 8,
    shadowOpacity: 1,
  },
});
