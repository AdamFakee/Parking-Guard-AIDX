import { useWindowDimensions } from 'react-native';

/**
 * Hook to calculate responsive dimensions based on viewport percentage.
 * 
 * Usage:
 * const { hp, wp } = useResponsive();
 * const heightVal = hp(92); // 92% of screen height
 * const widthVal = wp(100); // 100% of screen width
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  /**
   * Calculate height percentage
   * @param percentage - 0 to 100
   */
  const hp = (percentage: number) => {
    return (height * percentage) / 100;
  };

  /**
   * Calculate width percentage
   * @param percentage - 0 to 100
   */
  const wp = (percentage: number) => {
    return (width * percentage) / 100;
  };

  return { hp, wp, screenWidth: width, screenHeight: height };
};
