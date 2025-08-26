#!/usr/bin/env tsx
import 'dotenv/config';
import { storage } from '../storage';

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: tsx server/scripts/makeAdmin.ts <user-email>');
    process.exit(1);
  }
  const user = await storage.getUserByEmail(email);
  if (!user) {
    console.error('User not found for email:', email);
    process.exit(1);
  }
  if (user.role === 'admin') {
    console.log('User is already an admin.');
    process.exit(0);
  }
  await storage.updateUser(user.id, { role: 'admin' });
  console.log('User promoted to admin:', email);
}

run().catch(e => { console.error(e); process.exit(1); });
