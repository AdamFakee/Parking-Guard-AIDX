export type StaffRole = 'admin' | 'staff'

/** NV sau login cloud / PIN local. */
export interface Employee {
  id: string
  employeeCode: string
  displayName: string
  role: StaffRole
  status: string
}
