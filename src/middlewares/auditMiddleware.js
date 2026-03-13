const AuditLog = require("../models/AuditLog");

const createAuditLog = ({ action, targetType, targetIdResolver, detailsResolver }) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    try {
      if (req.user && body && body.success) {
        await AuditLog.create({
          actor: req.user._id,
          action,
          targetType,
          targetId: targetIdResolver ? targetIdResolver(req, body) : undefined,
          details: detailsResolver ? detailsResolver(req, body) : {}
        });
      }
    } catch (error) {
      console.error("Audit log error:", error.message);
    }

    return originalJson(body);
  };

  next();
};

module.exports = {
  createAuditLog
};
