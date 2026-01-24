const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding users...');

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123', // In production, hash this!
      role: 'admin',
    },
  });
  console.log({ admin });

  // 2. Create 8 Scanners
  for (let i = 1; i <= 8; i++) {
    const scanner = await prisma.user.upsert({
      where: { username: `scanner${i}` },
      update: {},
      create: {
        username: `scanner${i}`,
        password: 'scan123', // In production, hash this!
        role: 'scanner',
      },
    });
    console.log({ scanner });
  }

  console.log('Seeding completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
