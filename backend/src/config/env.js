import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
  quiet: true,
});

export function readConfig(environment = process.env) {
  const nodeEnv = environment.NODE_ENV || 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv))
    throw new Error('NODE_ENV must be development, test, or production.');
  const port = Number(environment.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be an integer between 1 and 65535.');
  const mongoUri = environment.MONGODB_URI;
  if (!mongoUri || !/^mongodb(?:\+srv)?:\/\//.test(mongoUri))
    throw new Error('MONGODB_URI must be a MongoDB connection string.');
  const jwtSecret = environment.JWT_SECRET;
  if (
    !jwtSecret ||
    jwtSecret.length < 32 ||
    /^(replace|change|your-secret)/i.test(jwtSecret)
  )
    throw new Error(
      'JWT_SECRET must be a random secret of at least 32 characters; replace the example placeholder.',
    );
  const expiration = environment.JWT_EXPIRES_IN || '7d';
  if (!/^[1-9]\d*(?:s|m|h|d|w|y)?$/.test(expiration))
    throw new Error(
      'JWT_EXPIRES_IN must be positive seconds or a duration such as 1h or 7d.',
    );
  const bcryptRounds = Number(environment.BCRYPT_SALT_ROUNDS || 12);
  if (!Number.isInteger(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 15)
    throw new Error('BCRYPT_SALT_ROUNDS must be an integer between 10 and 15.');
  const origins = (
    environment.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (
    !origins.length ||
    origins.some((origin) => {
      try {
        const parsed = new URL(origin);
        return (
          !['http:', 'https:'].includes(parsed.protocol) ||
          parsed.origin !== origin
        );
      } catch {
        return true;
      }
    })
  )
    throw new Error(
      'CORS_ORIGIN must contain explicit http(s) origins without paths or wildcards.',
    );
  return Object.freeze({
    nodeEnv,
    port,
    mongoUri,
    jwtSecret,
    jwtExpiresIn: /^\d+$/.test(expiration) ? Number(expiration) : expiration,
    bcryptRounds,
    corsOrigins: origins,
  });
}
export const config = readConfig();
