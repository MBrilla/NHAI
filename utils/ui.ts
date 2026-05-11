import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes based on a standard 5" screen (iPhone 13/14 roughly)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scales a value based on the screen width.
 */
export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scales a value based on the screen height.
 */
export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderate scaling for values that shouldn't grow as aggressively as screen width.
 * Useful for fonts and button heights.
 */
export const moderateScale = (size: number, factor = 0.5) => 
  size + (scale(size) - size) * factor;

/**
 * Scale a font size.
 */
export const scaleFont = (size: number) => {
  const newSize = (SCREEN_WIDTH / guidelineBaseWidth) * size;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };
