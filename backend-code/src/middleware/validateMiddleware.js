// Lightweight request body validator
// Usage: validate(['name', 'email', 'password'])

const validate = (requiredFields) => {
  return (req, res, next) => {
    const missing = requiredFields.filter(
      (field) => req.body[field] === undefined || req.body[field] === ""
    );

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
