import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
export function signToken(employeeId) {
  return jwt.sign({}, config.jwtSecret, {
    algorithm: 'HS256',
    subject: String(employeeId),
    issuer: 'crm-api',
    audience: 'crm-employees',
    expiresIn: config.jwtExpiresIn,
  });
}
export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
    issuer: 'crm-api',
    audience: 'crm-employees',
  });
}
