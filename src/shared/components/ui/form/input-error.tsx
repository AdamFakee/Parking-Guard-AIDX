import { Text } from 'react-native'

interface InputErrorProps {
  message: string
}

export const InputError = ({ message }: InputErrorProps) => {
  return <Text className="ml-1 mt-1 text-note-3 font-medium text-primary">{message}</Text>
}
