import { sendError } from '../utils/response.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params
  });

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.slice(1).join('.'),
      message: err.message
    }));

    return sendError(res, 'Validation failed', errors, 400);
  }

  req.body = result.data.body || req.body;
  req.query = result.data.query || req.query;
  req.params = result.data.params || req.params;

  next();
};

