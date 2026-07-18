import type { InferInput } from 'valibot'
import { LoginSchema } from '../schemas'

/** Form staff-login (online). */
export type TLoginForm = InferInput<typeof LoginSchema>
