import { useShiftStore } from '../store'

/** Current shift role flags — reuse instead of inline `role === 'staff'`. */
export function useShiftRole() {
  const role = useShiftStore((s) => s.currentShift?.role)
  return {
    role,
    isStaff: role === 'staff',
    isAdmin: role === 'admin',
  }
}

export function isAdminRole(role?: 'admin' | 'staff' | null) {
  return role === 'admin'
}

export function isStaffRole(role?: 'admin' | 'staff' | null) {
  return role === 'staff'
}
