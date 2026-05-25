import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function start() {
  try {
    await connectDB();
    const app = createApp();
    app.listen(env.port, '0.0.0.0', () => {
      console.log(`[server] listening on port ${env.port}`);
      console.log(`[server] environment: ${env.nodeEnv}`);
    });
  } catch (err) {
    console.error('[server] failed to start:', err);
    process.exit(1);
  }
}

start();
