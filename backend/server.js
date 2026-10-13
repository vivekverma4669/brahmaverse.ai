import { pathToFileURL } from 'node:url';
import { config } from './src/config/env.js';
import { connectDatabase, disconnectDatabase } from './src/config/database.js';
import { Employee } from './src/models/Employee.js';
import { Enquiry } from './src/models/Enquiry.js';
import app from './src/app.js';

export async function startServer() {
  let server;
  try {
    await connectDatabase(config.mongoUri);
    // Ensure the unique email index exists before accepting registrations.
    await Promise.all([Employee.init(), Enquiry.init()]);
    server = await new Promise((resolve, reject) => {
      const instance = app.listen(config.port, () => resolve(instance));
      instance.once('error', reject);
    });
  } catch (error) {
    await disconnectDatabase();
    throw error;
  }
  console.log(
    JSON.stringify({
      level: 'info',
      message: 'CRM API listening',
      port: config.port,
      environment: config.nodeEnv,
    }),
  );
  let shuttingDown = false;
  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    const timer = setTimeout(() => process.exit(1), 10000);
    timer.unref();
    try {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await disconnectDatabase();
      clearTimeout(timer);
    } catch {
      console.error('Failed to shut down CRM API cleanly.');
      process.exitCode = 1;
    }
  }
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  startServer().catch(async () => {
    console.error(
      'CRM startup failed. Check environment values, MongoDB connectivity, and port availability.',
    );
    await disconnectDatabase();
    process.exitCode = 1;
  });
}
