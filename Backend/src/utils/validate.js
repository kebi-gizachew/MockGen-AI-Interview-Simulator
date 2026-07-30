const HttpError = require("./httpError");

const requireFields = (body, fields) => {
  const missing = fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length > 0) {
    throw new HttpError(400, `Missing required fields: ${missing.join(", ")}.`);
  }
};

const requireOneOf = (value, allowed, label = "value") => {
  if (!allowed.includes(value)) {
    throw new HttpError(400, `Invalid ${label}. Allowed values: ${allowed.join(", ")}.`);
  }
};

module.exports = {
  requireFields,
  requireOneOf,
};
