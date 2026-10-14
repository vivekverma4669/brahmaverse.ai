import bcrypt from 'bcryptjs';
import { matchedData } from 'express-validator';
import { Employee } from '../models/Employee.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../utils/token.js';
import { employeeView } from '../utils/employeeView.js';

export async function register(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const employee = await Employee.create(data);
  res.status(201).json({
    success: true,
    message: 'Employee registered.',
    data: { employee: employeeView(employee) },
  });
}

export async function login(req, res) {
  const { email, password } = matchedData(req, { locations: ['body'] });
  const employee = await Employee.findOne({ email }).select('+password');
  if (!employee || !(await bcrypt.compare(password, employee.password)))
    throw new ApiError(401, 'Invalid email or password.');
  res.json({
    success: true,
    message: 'Login successful.',
    data: { token: signToken(employee._id), employee: employeeView(employee) },
  });
}

export function me(req, res) {
  res.json({ success: true, data: { employee: employeeView(req.employee) } });
}
