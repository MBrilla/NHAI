import { Animated, Easing } from 'react-native';

/**
 * Creates a fade-in animation
 */
export const createFadeInAnimation = (duration: number = 900) => {
  const fadeValue = new Animated.Value(0);
  const animation = Animated.timing(fadeValue, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
  return { fadeValue, animation };
};

/**
 * Creates a slide-up animation
 */
export const createSlideUpAnimation = (duration: number = 800) => {
  const slideValue = new Animated.Value(30);
  const animation = Animated.timing(slideValue, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
  return { slideValue, animation };
};

/**
 * Creates a glow/pulse animation
 */
export const createGlowAnimation = () => {
  const glowValue = new Animated.Value(0.6);
  const animation = Animated.loop(
    Animated.sequence([
      Animated.timing(glowValue, {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(glowValue, {
        toValue: 0.6,
        duration: 900,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
  return { glowValue, animation };
};

/**
 * Creates a scale animation
 */
export const createScaleAnimation = (
  fromScale: number = 0.95,
  toScale: number = 1,
  duration: number = 600
) => {
  const scaleValue = new Animated.Value(fromScale);
  const animation = Animated.timing(scaleValue, {
    toValue: toScale,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
  return { scaleValue, animation };
};

/**
 * Creates a rotate animation
 */
export const createRotateAnimation = (duration: number = 2000) => {
  const rotateValue = new Animated.Value(0);
  const animation = Animated.loop(
    Animated.timing(rotateValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
  return {
    rotateValue,
    animation,
    interpolation: rotateValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    }),
  };
};

/**
 * Combines multiple animations in parallel
 */
export const runAnimationsInParallel = (animations: Animated.CompositeAnimation[]) => {
  return Animated.parallel(animations);
};

/**
 * Combines multiple animations in sequence
 */
export const runAnimationsInSequence = (animations: Animated.CompositeAnimation[]) => {
  return Animated.sequence(animations);
};
