import { body, param, query, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';
export function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty())
    throw new ApiError(
      400,
      'Validation failed.',
      result
        .array({ onlyFirstError: true })
        .map((error) => ({ field: error.path, message: error.msg })),
    );
  next();
}
export function allowedBodyFields(fields) {
  return (req, _res, next) => {
    if (req.body === undefined) {
      req.body = {};
      return next();
    }
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))
      throw new ApiError(400, 'Request body must be a JSON object.');
    if (Object.keys(req.body).some((key) => !fields.includes(key)))
      throw new ApiError(400, 'Request contains unsupported fields.');
    next();
  };
}
const nameRule = () =>
  body('name')
    .isString()
    .withMessage('Name must be text.')
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must contain 2–100 characters.');
const emailRule = () =>
  body('email')
    .isString()
    .withMessage('Email must be text.')
    .bail()
    .trim()
    .isLength({ max: 254 })
    .isEmail()
    .withMessage('Enter a valid email address.')
    .toLowerCase();
const passwordRule = (min) =>
  body('password')
    .isString()
    .withMessage('Password must be text.')
    .bail()
    .isLength({ min })
    .withMessage(`Password must contain at least ${min} characters.`)
    .bail()
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage('Password must not exceed 72 UTF-8 bytes.');
export const registerValidation = [
  allowedBodyFields(['name', 'email', 'password']),
  nameRule(),
  emailRule(),
  passwordRule(8),
  validate,
];
export const loginValidation = [
  allowedBodyFields(['email', 'password']),
  emailRule(),
  passwordRule(1),
  validate,
];
export const enquiryValidation = [
  allowedBodyFields(['name', 'email', 'phone', 'courseInterest', 'message']),
  nameRule(),
  emailRule(),
  body('phone')
    .optional()
    .isString()
    .withMessage('Phone must be text.')
    .bail()
    .trim()
    .custom(
      (value) =>
        value === '' ||
        (/^[+\d][\d\s().-]{6,24}$/.test(value) &&
          value.replace(/\D/g, '').length >= 7 &&
          value.replace(/\D/g, '').length <= 15),
    )
    .withMessage('Enter a valid phone number.'),
  body('courseInterest')
    .isString()
    .withMessage('Course interest must be text.')
    .bail()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Course interest must contain 2–120 characters.'),
  body('message')
    .optional()
    .isString()
    .withMessage('Message must be text.')
    .bail()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Message must not exceed 2000 characters.'),
  validate,
];
export const claimValidation = [
  allowedBodyFields([]),
  param('id')
    .isMongoId()
    .withMessage('Enquiry ID must be a valid MongoDB ObjectId.'),
  validate,
];
export const paginationValidation = [
  (req, _res, next) => {
    if (Object.keys(req.query).some((key) => !['page', 'limit'].includes(key)))
      throw new ApiError(
        400,
        'Only page and limit query parameters are supported.',
      );
    next();
  },
  query('page')
    .optional()
    .isString()
    .withMessage('Page must be a single integer.')
    .bail()
    .isInt({ min: 1, max: 1000000 })
    .withMessage('Page must be a positive integer (maximum 1000000).'),
  query('limit')
    .optional()
    .isString()
    .withMessage('Limit must be a single integer.')
    .bail()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100.'),
  validate,
];
