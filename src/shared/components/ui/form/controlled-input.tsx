import { ReactNode } from 'react'
import { Control, FieldValues, Path, useController } from 'react-hook-form'
import { Text, View } from 'react-native'
import { Input, type InputProps } from './input'
import { InputError } from './input-error'

export interface ControlledInputProps<T extends FieldValues> extends Omit<
  InputProps,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> {
  control: Control<T, any, any>
  name: Path<T>
  label?: string
  required?: boolean
  error?: string
  leftElement?: ReactNode
  rightElement?: ReactNode
  topRightElement?: ReactNode
  containerClassName?: string
}

export function ControlledInput<T extends FieldValues>({
  control,
  name,
  className,
  label,
  required,
  error: customError,
  leftElement,
  rightElement,
  topRightElement,
  containerClassName,
  ...inputProps
}: ControlledInputProps<T>) {
  const {
    field: { onChange, onBlur, value },
    fieldState: { error: formError },
  } = useController({
    control,
    name,
  })

  const errorMessage = customError || formError?.message

  return (
    <View className={`gap-2 ${containerClassName || ''}`}>
      {(label || topRightElement) && (
        <View className="flex-row items-center justify-between ml-1">
          {label ? (
            <Text className="text-note1 text-black font-medium">
              {label}
              {required && <Text className="text-brand-red"> *</Text>}
            </Text>
          ) : (
            <View />
          )}
          {topRightElement}
        </View>
      )}

      <View className="relative justify-center">
        {leftElement && (
          <View className="absolute left-4 z-10">
            {leftElement}
          </View>
        )}
        <Input
          value={value}
          onBlur={onBlur}
          onChangeText={onChange}
          error={!!errorMessage}
          autoCapitalize="none"
          className={className}
          {...inputProps}
        />
        {rightElement && (
          <View className="absolute right-2 z-10">
            {rightElement}
          </View>
        )}
      </View>

      {errorMessage && <InputError message={errorMessage} />}
    </View>
  )
}
