import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env';

/** Node on Windows often gets ECONNREFUSED on SRV lookups via router DNS; public resolvers work. */
function configureDnsForAtlasSrv(): void {
  if (!env.mongoUri.startsWith('mongodb+srv://')) return;

  const custom = process.env.DNS_SERVERS?.split(',').map((s) => s.trim()).filter(Boolean);
  if (custom?.length) {
    dns.setServers(custom);
    return;
  }

  if (process.platform === 'win32') {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  }
}

export async function connectDB(): Promise<void> {
  configureDnsForAtlasSrv();
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log('[db] connected to MongoDB');
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
