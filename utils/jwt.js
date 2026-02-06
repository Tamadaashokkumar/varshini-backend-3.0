// import jwt from 'jsonwebtoken';

// /**
//  * Generate JWT Access Token
//  * Short-lived token for API authentication
//  * @param {Object} payload - Data to encode in token
//  * @returns {string} - JWT access token
//  */
// export const generateAccessToken = (payload) => {
//   return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
//     expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
//   });
// };

// /**
//  * Generate JWT Refresh Token
//  * Long-lived token for refreshing access tokens
//  * @param {Object} payload - Data to encode in token
//  * @returns {string} - JWT refresh token
//  */
// export const generateRefreshToken = (payload) => {
//   return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
//     expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
//   });
// };

// /**
//  * Verify JWT Access Token
//  * @param {string} token - JWT token to verify
//  * @returns {Object} - Decoded token payload
//  */
// export const verifyAccessToken = (token) => {
//   try {
//     return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
//   } catch (error) {
//     throw new Error('Invalid or expired access token');
//   }
// };

// /**
//  * Verify JWT Refresh Token
//  * @param {string} token - JWT token to verify
//  * @returns {Object} - Decoded token payload
//  */
// export const verifyRefreshToken = (token) => {
//   try {
//     return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
//   } catch (error) {
//     throw new Error('Invalid or expired refresh token');
//   }
// };

// /**
//  * Generate token pair (access + refresh)
//  * @param {Object} payload - Data to encode in tokens
//  * @returns {Object} - Object with accessToken and refreshToken
//  */
// export const generateTokenPair = (payload) => {
//   const accessToken = generateAccessToken(payload);
//   const refreshToken = generateRefreshToken(payload);

//   return {
//     accessToken,
//     refreshToken,
//   };
// };

import jwt from "jsonwebtoken";

/**
 * Generate JWT Access Token
 * Short-lived token for API authentication (15 mins)
 * Payload: { id, email, role }
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m",
  });
};

/**
 * Generate JWT Refresh Token
 * Long-lived token for refreshing access tokens (7 days)
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

/**
 * Generate Token Pair (Access + Refresh)
 * Returns both tokens at once
 */
export const generateTokenPair = (payload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
  };
};

/**
 * Verify JWT Access Token
 * Used mainly in socket.io or specific manual checks
 */
export const verifyAccessToken = (token) => {
  // try-catch తీసేసాను, ఎందుకంటే Error వస్తే Controller హ్యాండిల్ చేయడం మంచిది.
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify JWT Refresh Token
 * Used in refreshUserToken controller
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
