import { connectDB, disconnectDB } from './config/db';
import { User } from './models/User';
import { Role } from './types';

// One account per role so an evaluator can log in and test each module.
// Password is shared for convenience; change it for any real deployment.
const SEED_PASSWORD = 'Password123';

const accounts: Array<{ name: string; email: string; role: Role }> = [
  { name: 'Admin User', email: 'admin@lms.test', role: Role.Admin },
  { name: 'Sales Executive', email: 'sales@lms.test', role: Role.Sales },
  { name: 'Sanction Executive', email: 'sanction@lms.test', role: Role.Sanction },
  { name: 'Disbursement Executive', email: 'disbursement@lms.test', role: Role.Disbursement },
  { name: 'Collection Executive', email: 'collection@lms.test', role: Role.Collection },
  { name: 'Demo Borrower', email: 'borrower@lms.test', role: Role.Borrower },
];

async function seed() {
  await connectDB();

  for (const acc of accounts) {
    const existing = await User.findOne({ email: acc.email });
    if (existing) {
      existing.name = acc.name;
      existing.role = acc.role;
      existing.password = SEED_PASSWORD; // pre-save hook re-hashes
      await existing.save();
      console.log(`updated ${acc.role.padEnd(13)} -> ${acc.email}`);
    } else {
      await User.create({ ...acc, password: SEED_PASSWORD });
      console.log(`created ${acc.role.padEnd(13)} -> ${acc.email}`);
    }
  }

  console.log('\nSeed complete. All accounts share the password:', SEED_PASSWORD);
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
