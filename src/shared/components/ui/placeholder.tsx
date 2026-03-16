import { COLORS } from '@/shared/constants'
import { cn } from '@/shared/utils/cn'
import React from 'react'
import { Text, View, ViewProps } from 'react-native'

interface PlaceholderProps extends ViewProps {
  text?: string
  className?: string
}

export const Placeholder = ({ text, className, style, ...props }: PlaceholderProps) => {
  return (
    <View
      className={cn('h-full w-full items-center justify-center bg-app-dark', className)}
      style={[{ backgroundColor: COLORS.app.dark, width: '100%', height: '100%' }, style]}
      {...props}
    >
      {text && (
        <Text
          style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: 24,
            textAlign: 'center',
          }}
        >
          {text}
        </Text>
      )}
    </View>
  )
}
