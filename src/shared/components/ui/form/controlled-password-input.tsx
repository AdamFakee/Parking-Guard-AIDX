import { COLORS } from '@/shared/constants';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { FieldValues } from 'react-hook-form';
import { Pressable } from 'react-native';
import { ControlledInput, type ControlledInputProps } from './controlled-input';

export type ControlledPasswordInputProps<T extends FieldValues> = Omit<
  ControlledInputProps<T>,
  'rightElement' | 'secureTextEntry'
>;

export function ControlledPasswordInput<T extends FieldValues>(
  props: ControlledPasswordInputProps<T>
) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <ControlledInput
      {...props}
      secureTextEntry={!showPassword}
      rightElement={
        <Pressable
          className="p-2"
          onPress={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff size={24} color={COLORS.slate[400]} />
          ) : (
            <Eye size={24} color={COLORS.slate[400]} />
          )}
        </Pressable>
      }
    />
  );
}
