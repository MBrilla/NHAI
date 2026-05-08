import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useNailScanColors } from '@/hooks/use-nailscan-colors';

interface LogoMarkProps {
  size?: number;
  compact?: boolean;
}

export function LogoMark({ size = 72, compact = false }: LogoMarkProps) {
  const colors = useNailScanColors();

  const container = {
    width: size,
    height: size,
    borderRadius: size * 0.26,
  };

  const styles = makeStyles(colors);
  const iconSize = compact ? size * 0.52 : size * 0.58;
  const sparkleLarge = Math.max(4, Math.round(size * 0.06));
  const sparkleSmall = Math.max(3, Math.round(size * 0.04));

  return (
    <LinearGradient
      colors={['#3B82F6', '#1D4ED8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, container]}>
      <View style={[styles.sparkleLarge, { width: sparkleLarge, height: sparkleLarge, borderRadius: sparkleLarge / 2 }]} />
      <View style={[styles.sparkleSmall, { width: sparkleSmall, height: sparkleSmall, borderRadius: sparkleSmall / 2 }]} />
      <Ionicons name="finger-print" size={iconSize} color="#FFFFFF" />
    </LinearGradient>
  );
}

const makeStyles = (colors: ReturnType<typeof useNailScanColors>) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOpacity: 0.34,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  sparkleLarge: {
    position: 'absolute',
    top: '16%',
    right: '16%',
    backgroundColor: 'rgba(255,255,255,0.54)',
  },
  sparkleSmall: {
    position: 'absolute',
    bottom: '20%',
    left: '14%',
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
});
