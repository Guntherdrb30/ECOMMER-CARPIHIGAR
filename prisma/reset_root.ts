import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const oldRootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com');
  const newRootEmail = String(process.env.NEW_ROOT_EMAIL || 'admin@carpihogar.com');
  const newRootPassword = String(process.env.NEW_ROOT_PASSWORD || 'ChangeMe123!');

  console.log(`Attempting to reset credentials for root user...`);

  const user = await prisma.user.findUnique({
    where: { email: oldRootEmail },
  });

  if (!user) {
    console.error(`Error: Root user with email ${oldRootEmail} not found.`);
    console.log('If you have already changed this email, please update the script or database manually.');
    // As a fallback, let's try to find ANY admin user to update.
    const anyAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (anyAdmin) {
      console.log(`Found an admin user with email ${anyAdmin.email} instead. Updating this user.`);
      const hashedPassword = await bcrypt.hash(newRootPassword, 10);
      await prisma.user.update({
        where: { id: anyAdmin.id },
        data: {
          email: newRootEmail,
          password: hashedPassword,
        },
      });
      console.log(`Successfully updated admin user credentials.`);
      console.log(`New admin email: ${newRootEmail}`);
      console.log(`New admin password: ${newRootPassword}`);
      return;
    }
    console.error('Could not find any admin user to update.');
    return;
  }

  console.log('Root user found. Hashing new password and updating credentials...');
  const hashedPassword = await bcrypt.hash(newRootPassword, 10);

  await prisma.user.update({
    where: { email: oldRootEmail },
    data: {
      email: newRootEmail,
      password: hashedPassword,
    },
  });

  console.log(`Successfully updated root user credentials.`);
  console.log(`New root email: ${newRootEmail}`);
  console.log(`New root password: ${newRootPassword}`);
  console.log('Please try logging in with these new credentials.');
}

main()
  .catch((e) => {
    console.error('An error occurred while resetting the root credentials:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
