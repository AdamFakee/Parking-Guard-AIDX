import { cn } from '@/shared/utils'

import { TextInput, TextInputProps } from 'react-native'

export interface InputProps extends TextInputProps {
  className?: string
  error?: boolean
}

export const Input = ({ className, error, ...props }: InputProps) => {
  return (
    <TextInput
      className={cn(
        'border bg-white px-4 py-3 text-lg text-body border-primary h-[54px] rounded-lg',
        error ? 'bg-warning' : null,
        className,
      )}
      placeholderClassName='text-secondary'
      {...props}
    />
  )
}
