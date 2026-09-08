/**
 * Standard Success API Response
 * @param {import('express').Response} res 
 * @param {string} message 
 * @param {any} data 
 * @param {number} statusCode 
 */
export const sendSuccess = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Standard Error API Response
 * @param {import('express').Response} res 
 * @param {string} message 
 * @param {any[]} errors 
 * @param {number} statusCode 
 */
export const sendError = (res, message, errors = [], statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
