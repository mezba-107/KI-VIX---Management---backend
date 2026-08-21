const Admin = require("../models/Admin");

function requireRole(roles) {
  return async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.admin.id);

      if (!admin) {
        return res.status(401).json({
          message: "Admin Not Found",
        });
      }

      if (!roles.includes(admin.role)) {
        return res.status(403).json({
          message: "Access Denied",
        });
      }

      req.currentAdmin = admin;

      next();
    } catch (error) {
      res.status(500).json({
        message: "Server Error",
      });
    }
  };
}

module.exports = requireRole;
