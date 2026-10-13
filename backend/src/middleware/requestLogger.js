import { randomUUID } from 'node:crypto';
export function requestLogger(req, res, next) {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  const start = performance.now();
  res.on('finish', () => {
    if (process.env.NODE_ENV !== 'test')
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Math.round(performance.now() - start),
        }),
      );
  });
  next();
}
