export const NailScanThemes = {
  light: {
    primary: '#0B5CFF',
    primaryLight: '#6EA8FF',
    primaryDark: '#073B9A',
    primaryDeep: '#002D7A',
    secondary: '#3B82F6',
    background: '#F7FAFF',
    backgroundSoft: '#EAF2FF',
    text: '#0A2A66',
    textSecondary: '#46639A',
    textMuted: '#8AA0C8',
    mutedText: '#8AA0C8',
    descriptionDark: '#28477D',
    card: '#FFFFFF',
    cardSoft: '#F1F6FF',
    healthy: '#30C48D',
    healthySoft: '#E8FFF5',
    alert: '#FF6B6B',
    alertSoft: '#FFEEEE',
    warning: '#FFA048',
    warningSoft: '#FFF4E7',
    infoSoft: '#EAF2FF',
    border: '#D6E4FF',
    shadow: 'rgba(11, 92, 255, 0.1)',
    tagline: '#475569',
  },
  dark: {
    primary: '#60A5FA',
    primaryLight: '#93C5FD',
    primaryDark: '#1E40AF',
    primaryDeep: '#1E3A8A',
    secondary: '#93C5FD',
    background: '#0F172A',
    backgroundSoft: '#1E293B',
    text: '#E5E7EB',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    mutedText: '#94A3B8',
    descriptionDark: '#CBD5E1',
    card: '#1E293B',
    cardSoft: '#0F172A',
    healthy: '#4ADE80',
    healthySoft: '#1A3A2A',
    alert: '#F87171',
    alertSoft: '#3A2020',
    warning: '#FBBF24',
    warningSoft: '#3A2A1A',
    infoSoft: '#1E40AF',
    border: '#334155',
    shadow: 'rgba(0, 0, 0, 0.35)',
    tagline: '#CBD5E1',
  },
} as const;

export type NailScanPalette = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryDeep: string;
  secondary: string;
  background: string;
  backgroundSoft: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  mutedText: string;
  descriptionDark: string;
  card: string;
  cardSoft: string;
  healthy: string;
  healthySoft: string;
  alert: string;
  alertSoft: string;
  warning: string;
  warningSoft: string;
  infoSoft: string;
  border: string;
  shadow: string;
  tagline: string;
};

export const NailScanColors: NailScanPalette = NailScanThemes.light as unknown as NailScanPalette;

export function getNailScanColors(scheme?: string | null): NailScanPalette {
  return (scheme === 'dark' ? NailScanThemes.dark : NailScanThemes.light) as unknown as NailScanPalette;
}

export const NailScanSpacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const NailScanTypography = {
  title: 30,
  subtitle: 20,
  body: 15,
  caption: 13,
} as const;

export const NailScanTaglines = [
  'Scan. Detect. Protect.',
  'AI-Powered Nail Health Analysis',
  'Check your nail health in seconds',
] as const;

export const DiagnosisLabels = ['beau_lines', 'clubbing', 'healthy_nails', 'pitting'] as const;

export type DiagnosisLabel = (typeof DiagnosisLabels)[number];