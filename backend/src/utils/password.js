import argon2 from 'argon2';

/**
 * Hash a plain text password using Argon2id with recommended OWASP/SIH security parameters.
 * @param {string} password 
 * @returns {Promise<string>}
 */
export const hashPassword = async (password) => {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 3 iterations
    parallelism: 1
  });
};

/**
 * Verify a plain text password against an Argon2id hash.
 * @param {string} hash 
 * @param {string} password 
 * @returns {Promise<boolean>}
 */
export const verifyPassword = async (hash, password) => {
  try {
    if (!hash || !password) return false;
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
};
