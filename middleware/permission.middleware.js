const { ROLE_PERMISSIONS } = require("../config/permissions");
const RoleConstants = require("../models/roleConstants");



const DEFAULT_ROLES = [
  'owner',
  'admin',
  'agent',
  'user',
  'guest'
]


function permissions(requiredPermission) {

  return (req, res, next) => {
    try {
      const projectUser = req.projectuser; // populated by has-role middleware

      if (!projectUser) {
        return res.status(403).json({ error: 'Project user not found' });
      }
      
      if (!requiredPermission) {
        return next();
      }

      let permissions = [];

      if (projectUser.roleType === RoleConstants.TYPE_AGENTS) {
        if (DEFAULT_ROLES.includes(projectUser.role)) {
          permissions = ROLE_PERMISSIONS[projectUser.role] || [];
        } else {
          permissions = projectUser.permissions || [];
        }
      } else {
        // For non-agent users rely on explicit permissions on project_user.
        permissions = projectUser.permissions || [];
      }

      const permissionNamespace = requiredPermission.includes(':')
        ? requiredPermission.split(':')[0] + ':*'
        : null;

      const hasPermission =
        permissions.includes('*') ||
        permissions.includes(requiredPermission) ||
        (permissionNamespace && permissions.includes(permissionNamespace));

      if (!hasPermission) {
        return res.status(403).json({ error: 'Forbidden: you don\'t have the required permission.' });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = permissions;