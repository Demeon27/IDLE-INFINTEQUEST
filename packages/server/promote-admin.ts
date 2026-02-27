import { PrismaClient } from '@prisma/client';

async function promoteAdmin() {
    const prisma = new PrismaClient();
    try {
        const email = 'manthos@live.be';
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' },
        });
        console.log(`✅ Success: User ${user.username} (${user.email}) has been promoted to ADMIN.`);
    } catch (error) {
        console.error(`❌ Error promoting user:`, error.message);
    } finally {
        await prisma.$disconnect();
    }
}

promoteAdmin();
