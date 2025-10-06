import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ROOT_EMAIL || 'root@carpihogar.ai';
  const plain = process.env.ROOT_PASSWORD || '';

  if (!plain) {
    console.error('Missing ROOT_PASSWORD env var. Example:');
    console.error('  ROOT_EMAIL=root@carpihogar.ai ROOT_PASSWORD=StrongPass123! npm run root:create');
    process.exit(1);
  }

  const password = await bcrypt.hash(plain, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { password, role: 'ADMIN', alliedStatus: 'NONE', name: 'Root' },
    create: { name: 'Root', email, password, role: 'ADMIN', alliedStatus: 'NONE' },
  });

  console.log(`Root admin ensured: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

