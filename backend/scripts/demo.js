// Optional disposable local MongoDB for reviewing the assignment without installing MongoDB.
// This still runs real MongoDB/Mongoose; data is intentionally ephemeral.
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET ||= randomBytes(48).toString('hex');
process.env.PORT ||= '5000';
const mongo = await MongoMemoryServer.create({
  binary: {
    version: '7.0.24',
    downloadDir: fileURLToPath(new URL('../.cache/mongodb', import.meta.url)),
  },
});
process.env.MONGODB_URI = mongo.getUri('crm_assignment_demo');
const { startServer } = await import('../server.js');
try {
  const server = await startServer();
  server.on('close', () => {
    mongo.stop().catch(() => {
      process.exitCode = 1;
    });
  });
  console.log(
    'Disposable demo database ready. Data is lost when this process stops.',
  );
} catch (error) {
  await mongo.stop();
  console.error(
    `Demo startup failed (${error.code || error.name}); check MongoDB connectivity and local port availability.`,
  );
  process.exitCode = 1;
}
