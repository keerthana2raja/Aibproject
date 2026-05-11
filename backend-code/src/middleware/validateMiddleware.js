// Lightweight request body validator
// Usage: validate(['name', 'email', 'password'])

const isMissingRequired = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && !value.trim()) return true;
  return false;
};

const validate = (requiredFields) => {
  return (req, res, next) => {
    const missing = requiredFields.filter((field) => isMissingRequired(req.body[field]));

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }
    next();
  };
};

module.exports = validate;
