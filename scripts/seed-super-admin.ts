/**
 * Seed the first super-admin user.
 *
 * Creates a Supabase auth account AND a super_admins DB record.
 *
 * Usage:
 *   npx tsx scripts/seed-super-admin.ts <email> <password> <firstName> <lastName>
 *
 * Example:
 *   npx tsx scripts/seed-super-admin.ts admin@anchor.dev MySecurePass123 Admin User
 *
 * Requires: root .env with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config(); // Load root .env

const [, , email, password, firstName, lastName] = process.argv;

if (!email || !password || !firstName || !lastName) {
  console.error(
    'Usage: npx tsx scripts/seed-super-admin.ts <email> <password> <firstName> <lastName>',
  );
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

async function main() {
  // 1. Create auth user with password (email auto-confirmed)
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    // If user already exists in auth, look them up
    if (authError.message.includes('already been registered')) {
      console.log(`Auth user ${email} already exists, checking super_admins table...`);
    } else {
      console.error('Failed to create auth user:', authError.message);
      process.exit(1);
    }
  } else {
    console.log(`Created auth user: ${authData.user.id}`);
  }

  // 2. Check if super_admin record already exists
  const existing = await prisma.superAdmin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Super-admin record already exists for ${email} (id: ${existing.id})`);
    if (!existing.isActive) {
      await prisma.superAdmin.update({
        where: { email },
        data: { isActive: true },
      });
      console.log('Re-activated existing super-admin record.');
    }
  } else {
    // 3. Create super_admins record
    const record = await prisma.superAdmin.create({
      data: { email, firstName, lastName },
    });
    console.log(`Created super-admin record: ${record.id}`);
  }

  console.log(`\nDone! Log in at http://localhost:3002 with:`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: (the one you provided)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
