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
        'border bg-app-surface px-4 py-3 text-lg text-slate-100 border-slate-700 h-[54px] rounded-lg',
        error ? 'bg-brand-red/10 border-brand-red' : null,
        className,
      )}
      placeholderClassName='text-slate-400'
      {...props}
    />
  )
}
