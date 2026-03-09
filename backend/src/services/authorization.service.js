import { ROLE_PERMISSION_MATRIX } from '../utils/index.js'

const hasTripPermission = (role, permission) => {
  const allowedPermissions = ROLE_PERMISSION_MATRIX[role] || []
  return allowedPermissions.includes(permission)
}

export { hasTripPermission }
