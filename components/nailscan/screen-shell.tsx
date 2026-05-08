import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNailScanColors } from '@/hooks/use-nailscan-colors';
import { SoftCircle } from './soft-circle';
import { BokehBackground } from './bokeh-background';

interface ScreenShellProps {
  children: ReactNode;
  variant?: 'default' | 'teal';
  fullBleed?: boolean;
}

export function ScreenShell({ children, variant = 'default', fullBleed = false }: ScreenShellProps) {
  const colors = useNailScanColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets.bottom, variant, fullBleed);

  // Flutter gradient colors for premium background
  const gradientColors =
    variant === 'teal'
      ? ['#162A3A', '#0F4A5C', '#0D3D4D']
      : ['#D5EBFF', '#EEF7FF', '#BFDFFF', '#88C4FF'];

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={gradientColors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.backgroundGradient} />
      
      {/* Premium Floating Shapes */}
      <SoftCircle size={280} top={-60} right={-60} opacity={0.33} />
      <SoftCircle size={260} top={170} left={-75} opacity={0.20} />
      <SoftCircle size={240} bottom={80} right={-45} opacity={0.20} />
      
      {/* Bokeh Effect */}
      <BokehBackground />

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.container}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (
  colors: ReturnType<typeof useNailScanColors>,
  bottomInset: number,
  variant: 'default' | 'teal',
  fullBleed: boolean,
) =>
  StyleSheet.create({
    outerContainer: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    backgroundGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    container: {
      flex: 1,
      paddingHorizontal: fullBleed ? 0 : 20,
      paddingBottom: Math.max(bottomInset, 8),
    },
  });

