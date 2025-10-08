import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Create Root/Admin and demo users
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com');
  const rootPassword = await bcrypt.hash('Root123!', 10);
  await prisma.user.upsert({
    where: { email: rootEmail },
    update: { password: rootPassword, role: 'ADMIN', alliedStatus: 'NONE', name: 'Root' },
    create: {
      name: 'Root',
      email: rootEmail,
      password: rootPassword,
      role: 'ADMIN',
      alliedStatus: 'NONE',
    },
  });

  const clientEmail = 'cliente@carpihogar.ai';
  const clientPassword = await bcrypt.hash('Cliente123!', 10);
  await prisma.user.upsert({
    where: { email: clientEmail },
    update: { password: clientPassword, role: 'CLIENTE', alliedStatus: 'NONE', name: 'Cliente Demo' },
    create: {
      name: 'Cliente Demo',
      email: clientEmail,
      password: clientPassword,
      role: 'CLIENTE',
      alliedStatus: 'NONE',
    },
  });

  const allyEmail = 'aliado@carpihogar.ai';
  const allyPassword = await bcrypt.hash('Aliado123!', 10);
  await prisma.user.upsert({
    where: { email: allyEmail },
    update: { password: allyPassword, role: 'ALIADO', alliedStatus: 'APPROVED', name: 'Cliente Aliado' },
    create: {
      name: 'Cliente Aliado',
      email: allyEmail,
      password: allyPassword,
      role: 'ALIADO',
      alliedStatus: 'APPROVED',
    },
  });

  // Create Categories
  const cat1 = await prisma.category.upsert({
    where: { slug: 'cocinas' },
    update: {},
    create: { name: 'Cocinas', slug: 'cocinas' },
  });

  const cat2 = await prisma.category.upsert({
    where: { slug: 'closets' },
    update: {},
    create: { name: 'Clósets', slug: 'closets' },
  });

  const cat3 = await prisma.category.upsert({
    where: { slug: 'bano' },
    update: {},
    create: { name: 'Baño', slug: 'bano' },
  });

  const cat4 = await prisma.category.upsert({
    where: { slug: 'decoracion' },
    update: {},
    create: { name: 'Decoración', slug: 'decoracion' },
  });

  console.log('Categories created.');

  // Create Products
  const products = [
    { name: 'Gabinete de Cocina Moderno', slug: 'gabinete-cocina-moderno', categoryId: cat1.id, priceUSD: 499.99, isNew: true, images: ['https://via.placeholder.com/400'] },
    { name: 'Clóset de 6 Puertas', slug: 'closet-6-puertas', categoryId: cat2.id, priceUSD: 349.50, images: ['https://via.placeholder.com/400'] },
    { name: 'Espejo de Baño con Luz LED', slug: 'espejo-bano-led', categoryId: cat3.id, priceUSD: 120.00, isNew: true, images: ['https://via.placeholder.com/400'] },
    { name: 'Lámpara de Techo Decorativa', slug: 'lampara-techo-decorativa', categoryId: cat4.id, priceUSD: 89.99, images: ['https://via.placeholder.com/400'] },
    { name: 'Isla de Cocina con Tope de Granito', slug: 'isla-cocina-granito', categoryId: cat1.id, priceUSD: 750.00, images: ['https://via.placeholder.com/400'] },
    { name: 'Organizador de Clóset Modular', slug: 'organizador-closet-modular', categoryId: cat2.id, priceUSD: 150.75, isNew: true, images: ['https://via.placeholder.com/400'] },
    { name: 'Mueble de Lavamanos', slug: 'mueble-lavamanos', categoryId: cat3.id, priceUSD: 225.00, images: ['https://via.placeholder.com/400'] },
    { name: 'Set de Cojines Decorativos', slug: 'set-cojines-decorativos', categoryId: cat4.id, priceUSD: 45.50, images: ['https://via.placeholder.com/400'] },
  ];

  for (const productData of products) {
    const withBrand = ({ brand: 'Carpihogar', ...productData } as any);
    await prisma.product.upsert({
      where: { slug: (productData as any).slug },
      update: withBrand,
      create: withBrand,
    });
  }

  console.log('Products created.');

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
