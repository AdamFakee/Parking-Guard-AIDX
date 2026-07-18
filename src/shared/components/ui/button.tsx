import { COLORS } from '@/shared/constants';
import { cn } from '@/shared/utils';
import { LucideIcon } from 'lucide-react-native';
import { Pressable, PressableProps, Text, View } from 'react-native';
import { LoadingIndicator } from './loading';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'outline' | 'secondary';
  loading?: boolean;
  className?: string;
  textClassName?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  iconSize?: number;
}

const variantStyles = {
  primary: 'bg-brand-blue border-brand-blue',
  secondary: 'bg-app-surface border-slate-700',
  outline: 'bg-transparent border-brand-blue',
};

export const Button = ({
  label,
  variant = 'primary',
  loading = false,
  className,
  textClassName,
  disabled,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  iconSize = 20,
  style,
  ...props
}: ButtonProps) => {
  const iconColor = variant === 'primary' ? COLORS.slate[100] : COLORS.brand.blue;

  return (
    <Pressable
      disabled={disabled}
      className={cn(
        // Base styles
        'h-12 flex-row items-center justify-center rounded-full border px-12 py-3',
        // Variants
        variantStyles[variant],
        // Disabled/Loading state
        disabled && 'opacity-50',
        className
      )}
      style={(state) => [
        { opacity: state.pressed && !disabled ? 0.8 : disabled ? 0.5 : 1 },
        typeof style === 'function' ? style(state) : style,
      ] as any}

      {...props}
    >
{/* Một child ổn định — tránh Fabric addViewAt khi swap loading */}
      <View className="flex-row items-center justify-center">
        {loading ? (
          <LoadingIndicator color={iconColor} />
        ) : (
          <>
            {LeftIcon ? (
              <View className="mr-3">
                <LeftIcon size={iconSize} color={iconColor} />
              </View>
            ) : null}
            <Text
              className={cn(
                'text-center text-button font-semibold',
                variant === 'primary' ? 'text-slate-100' : 'text-brand-blue',
                textClassName
              )}
            >
              {label}
            </Text>
            {RightIcon ? (
              <View className="ml-3">
                <RightIcon size={iconSize} color={iconColor} />
              </View>
            ) : null}
          </>
        )}
      </View>
    </Pressable>
  );
};
