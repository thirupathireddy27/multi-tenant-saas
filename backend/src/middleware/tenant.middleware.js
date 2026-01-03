module.exports = (req, res, next) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(401).json({
      success: false,
      message: "Tenant context missing",
    });
  }

  // Single source of truth
  req.tenantId = req.user.tenantId;
  next();
};
