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
  /**
   * Title color class (optional override).
   */
  titleClassName?: string;
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
  showBorderBottom = true,
  borderBottomColor,
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
        return { 
          bg: COLORS.app.darker, 
          text: 'text-white', 
          icon: '#F1F5F9',
          border: 'rgba(255,255,255,0.06)' 
        };
      case 'white':
      case 'surface':
      default:
        return { 
          bg: '#FFFFFF', 
          text: 'text-slate-900', 
          icon: '#1E293B',
          border: '#F1F5F9'
        };
    }
  };

  const { 
    bg: backgroundColor, 
    text: textColorClass, 
    icon: iconColor,
    border: defaultBorderColor 
  } = getColors();

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
          height: LAYOUT.headerHeight + insets.top,
        }, 
        showBorderBottom && { 
          borderBottomWidth: 1, 
          borderBottomColor: borderBottomColor || defaultBorderColor 
        }
      ]}
      className="w-full flex-row items-center justify-between px-6"
    >
      {/* Left Section: Back Button */}
      <View className="w-10 items-start justify-center">
        {showLeftButton && (
          <Pressable
            onPress={handleLeftPress}
            hitSlop={12}
            className="size-10 items-center justify-center -ml-2 rounded-full active:bg-slate-100/50"
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.92 : 1 }],
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <ChevronLeft size={28} color={iconColor} strokeWidth={2.5} />
          </Pressable>
        )}
      </View>
 
      {/* Center Section: Title */}
      <View className="flex-1 items-center justify-center py-2">
        {title && (
          <Text
            className={`text-lg font-black text-center tracking-tight ${textColorClass}`}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
      </View>
 
      {/* Right Section: Action Icon */}
      <View className="w-10 items-end justify-center">
        {rightIcon && (
          <Pressable
            onPress={onRightPress}
            hitSlop={12}
            className="size-10 items-center justify-center -mr-2 rounded-full active:bg-slate-100/50"
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.92 : 1 }],
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {renderRightIcon()}
          </Pressable>
        )}
      </View>
    </View>
  );
};