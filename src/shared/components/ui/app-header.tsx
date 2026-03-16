import { COLORS, LAYOUT } from '@/shared/constants';
import { useRouter } from 'expo-router';
import { ChevronLeft, LucideIcon } from 'lucide-react-native';
import { isValidElement, ReactNode } from 'react';
import { Image, ImageSourcePropType, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Props for the AppHeader component.
 */
interface AppHeaderProps {
  /**
   * Title displayed in the center of the header.
   */
  title?: string;
  /**
   * Visual variant of the header.
   * - 'surface': Uses the app surface background (default).
   * - 'dark': Uses the darker background color.
   */
  variant?: 'surface' | 'dark' | 'white';
  /**
   * Custom handler for the left (back) button press.
   */
  onLeftPress?: () => void;
  /**
   * Icon to display on the right side.
   */
  rightIcon?: LucideIcon | ImageSourcePropType | ReactNode;
  /**
   * Handler for the right icon press.
   */
  onRightPress?: () => void;
  /**
   * Whether to show the left (back) button.
   */
  showLeftButton?: boolean;
  /**
   * Whether to show a bottom border.
   */
  showBorderBottom?: boolean;
  /**
   * Color of the bottom border.
   */
  borderBottomColor?: string;
}

/**
 * A reusable header component with a solid background.
 * Handles safe area, back navigation, and optional right actions.
 */
export const AppHeader = ({
  title,
  variant = 'surface',
  onLeftPress,
  rightIcon,
  onRightPress,
  showLeftButton = true,
  showBorderBottom = false,
  borderBottomColor = COLORS.slate[700],
}: AppHeaderProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /**
   * Handles back navigation.
   */
  const handleLeftPress = () => {
    if (onLeftPress) {
      onLeftPress();
    } else {
      if (router.canGoBack()) {
        router.back();
      }
    }
  };

  // Determine colors based on variant
  const getColors = () => {
    switch (variant) {
      case 'dark':
        return { bg: COLORS.app.darker, text: 'text-slate-100', icon: COLORS.slate[100] };
      case 'white':
        return { bg: COLORS.background.white, text: 'text-slate-700', icon: COLORS.slate[700] };
      case 'surface':
      default:
        return { bg: COLORS.app.surface, text: 'text-slate-100', icon: COLORS.slate[100] };
    }
  };

  const { bg: backgroundColor, text: textColorClass, icon: iconColor } = getColors();

  /**
   * Renders the right icon based on its type.
   */
  const renderRightIcon = () => {
    if (!rightIcon) return null;

    if (isValidElement(rightIcon)) {
      return rightIcon;
    }

    if (typeof rightIcon === 'object') {
      const Icon = rightIcon as LucideIcon;
      return <Icon size={24} color={iconColor} />;
    }

    return (
      <Image
        source={rightIcon as ImageSourcePropType}
        className="h-6 w-6"
        style={{ tintColor: iconColor }}
        resizeMode="contain"
      />
    );
  };

  return (
    <View 
      style={[
        { 
          backgroundColor,
          paddingTop: insets.top, 
          height: LAYOUT.headerHeight + insets.top / 2 
        }, 
        showBorderBottom && { borderBottomWidth: 1, borderBottomColor }
      ]}
      className="w-full flex-row items-center justify-between px-4"
    >
      {/* Left Section: Back Button */}
      <View className="w-12 items-start">
        {showLeftButton && (
          <Pressable
            onPress={handleLeftPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <ChevronLeft size={30} color={iconColor} />
          </Pressable>
        )}
      </View>

      {/* Center Section: Title */}
      <View className="flex-1 items-center justify-center">
        {title && (
          <Text
            className={'text-medium text-center ' + textColorClass}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
      </View>

      {/* Right Section: Action Icon */}
      <View className="w-12 items-end">
        {rightIcon && (
          <Pressable
            onPress={onRightPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            {renderRightIcon()}
          </Pressable>
        )}
      </View>
    </View>
  );
};