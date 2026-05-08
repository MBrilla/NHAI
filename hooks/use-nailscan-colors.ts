import { getNailScanColors } from '@/constants/nailscan-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useNailScanColors() {
  const scheme = useColorScheme();
  return getNailScanColors(scheme);
}
