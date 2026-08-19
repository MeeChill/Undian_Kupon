import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding users...');

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
    },
  });
  console.log({ admin });

  for (let rt = 1; rt <= 4; rt++) {
    for (let scannerNo = 1; scannerNo <= 4; scannerNo++) {
      const username = `scanner-rt${String(rt).padStart(2, '0')}-${scannerNo}`;
      const scanner = await prisma.user.upsert({
        where: { username },
        update: {},
        create: {
          username,
          password: 'scan123',
          role: 'scanner',
        },
      });
      console.log({ scanner });
    }
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