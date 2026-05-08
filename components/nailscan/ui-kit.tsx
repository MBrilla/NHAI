import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useNailScanColors } from '@/hooks/use-nailscan-colors';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export function ActionButton({ label, onPress, variant = 'primary', disabled = false, iconName }: ActionButtonProps) {
  const colors = useNailScanColors();
  const styles = makeStyles(colors);
  const primary = variant === 'primary';
  const destructive = variant === 'destructive';
  const iconColor = primary || destructive ? '#FFFFFF' : '#0F9F85';

  const buttonContent = (
    <View style={styles.contentRow}>
      {iconName ? <Ionicons name={iconName} size={16} color={iconColor} /> : null}
      <Text style={[styles.buttonText, primary ? styles.primaryText : destructive ? styles.destructiveText : styles.secondaryText]}>{label}</Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primaryButton : destructive ? styles.destructiveButton : styles.secondaryButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}>
      {primary ? (
        <LinearGradient
          colors={['#21B884', '#159B9D', '#0D7EA9']}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 1, y: 0.6 }}
          style={[styles.gradientFill, disabled && styles.gradientFillDisabled]}>
          {buttonContent}
        </LinearGradient>
      ) : destructive ? (
        buttonContent
      ) : (
        buttonContent
      )}
    </Pressable>
  );
}

interface CardProps {
  title: string;
  body: string;
  icon?: ReactNode;
}

export function InfoCard({ title, body, icon }: CardProps) {
  const colors = useNailScanColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        {icon}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardBody}>{body}</Text>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useNailScanColors>) => StyleSheet.create({
  button: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: 16,
    minHeight: 56,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#159B9D',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
  },
  primaryButton: {
    borderWidth: 0,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DBE3',
    shadowColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  destructiveButton: {
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#B91C1C',
    shadowColor: '#B91C1C',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.56,
  },
  gradientFill: {
    width: '100%',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  gradientFillDisabled: {
    opacity: 0.82,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    color: '#F7FFFC',
  },
  secondaryText: {
    color: '#0F9F85',
  },
  destructiveText: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 12,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.mutedText,
  },
});
