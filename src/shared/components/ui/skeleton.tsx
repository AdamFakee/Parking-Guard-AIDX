import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';
import { cn } from '@/shared/utils';

interface SkeletonProps extends ViewProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

export const Skeleton = ({ 
  className, 
  width, 
  height, 
  borderRadius = 4,
  style,
  ...props 
}: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();
    
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any || '100%',
          height: height as any || 20,
          borderRadius: borderRadius,
          backgroundColor: '#E2E8F0',
          opacity: opacity,
        },
        style as any,
      ]}
      className={cn(className)}
      {...props}
    />
  );
};
