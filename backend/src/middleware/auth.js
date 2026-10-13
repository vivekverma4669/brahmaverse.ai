import mongoose from 'mongoose';
import { Employee } from '../models/Employee.js';
import { verifyToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';
export async function authenticate(req, _res, next) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.get('Authorization') || '');
  if (!match) throw new ApiError(401, 'A valid Bearer token is required.');
  let payload;
  try {
    payload = verifyToken(match[1]);
  } catch {
    throw new ApiError(401, 'Invalid or expired authentication token.');
  }
  if (
    typeof payload !== 'object' ||
    !mongoose.isObjectIdOrHexString(payload.sub)
  )
    throw new ApiError(401, 'Invalid authentication token.');
  const employee = await Employee.findById(payload.sub);
  if (!employee)
    throw new ApiError(401, 'The authenticated employee no longer exists.');
  req.employee = employee;
  next();
}
