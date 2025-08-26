#!/usr/bin/env tsx
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { storage } from '../storage';

async function run() {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  if (!email || !newPassword) {
    console.error('Usage: tsx server/scripts/setAdminPassword.ts <admin-email> <new-password>');
    process.exit(1);
  }
  if (newPassword.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }
  const user = await storage.getUserByEmail(email);
  if (!user) {
    console.error('User not found for email:', email);
    process.exit(1);
  }
  if (user.role !== 'admin') {
    console.error('User is not an admin (role=' + user.role + ').');
    process.exit(1);
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await storage.updateUser(user.id, { password: hashed });
  console.log('Admin password updated for', email);
}

run().catch(e => { console.error(e); process.exit(1); });
