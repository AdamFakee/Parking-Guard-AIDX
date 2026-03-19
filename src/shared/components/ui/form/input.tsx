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
        'border bg-[#F8FAFC] px-6 text-lg font-bold text-slate-900 border-[#E2E8F0] h-16 rounded-[24px]',
        error ? 'bg-red-50 border-red-200 text-red-600' : null,
        className,
      )}
      placeholderClassName="text-slate-400 font-normal"
      placeholderTextColor="#94A3B8"
      {...props}
    />
  )
}
