import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Store a new message in the database.
     */
    async saveMessage(senderId: string, content: string, channel: string = 'global') {
        // Enforce max length
        const safeContent = content.substring(0, 500);

        const message = await this.prisma.chatMessage.create({
            data: {
                senderId,
                content: safeContent,
                channel
            },
            include: {
                sender: { select: { id: true, username: true, role: true } }
            }
        });

        return message;
    }

    /**
     * Retrieve the last N messages of a channel to hydrate the client on connection.
     */
    async getRecentMessages(channel: string = 'global', limit: number = 50) {
        const messages = await this.prisma.chatMessage.findMany({
            where: { channel },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                sender: { select: { id: true, username: true, role: true } }
            }
        });

        // Prisma returns them newest first (desc). We want chronological order for the UI.
        return messages.reverse();
    }
}
