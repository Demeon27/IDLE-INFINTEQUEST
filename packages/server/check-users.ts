import { PrismaClient } from '@prisma/client';

async function check() {
    const prisma = new PrismaClient();
    const users = await prisma.user.findMany({
        select: { email: true, username: true, role: true }
    });
    console.log('--- Current Users ---');
    console.table(users);
    await prisma.$disconnect();
}
check();
