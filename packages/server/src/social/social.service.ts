import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocialService {
    constructor(private prisma: PrismaService) { }

    // --- Forum Categories ---
    async getCategories() {
        return this.prisma.forumCategory.findMany({
            include: {
                _count: {
                    select: { topics: true }
                }
            },
            orderBy: { order: 'asc' }
        });
    }

    // --- Topics ---
    async getTopics(categoryId: string) {
        return this.prisma.forumTopic.findMany({
            where: { categoryId },
            include: {
                author: {
                    select: { username: true, level: true }
                },
                _count: {
                    select: { posts: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    async createTopic(authorId: string, categoryId: string, title: string, content: string) {
        return this.prisma.forumTopic.create({
            data: {
                title,
                categoryId,
                authorId,
                posts: {
                    create: {
                        content,
                        authorId
                    }
                }
            }
        });
    }

    // --- Posts ---
    async getTopicWithPosts(topicId: string) {
        const topic = await this.prisma.forumTopic.findUnique({
            where: { id: topicId },
            include: {
                author: {
                    select: { username: true, level: true }
                },
                posts: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                level: true,
                                // TODO: Inclure les données LayeredSprite du profil
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!topic) throw new NotFoundException('Sujet introuvable');
        return topic;
    }

    async addPost(authorId: string, topicId: string, content: string) {
        const post = await this.prisma.forumPost.create({
            data: {
                content,
                topicId,
                authorId
            }
        });

        // Update topic timestamp
        await this.prisma.forumTopic.update({
            where: { id: topicId },
            data: { updatedAt: new Date() }
        });

        return post;
    }

    // Seed Categories
    async seedForum() {
        const count = await this.prisma.forumCategory.count();
        if (count === 0) {
            await this.prisma.forumCategory.createMany({
                data: [
                    { name: '📢 Annonces', description: 'Nouvelles du Royaume et mises à jour.', order: 1 },
                    { name: '🍺 La Taverne', description: 'Discussion générale entre aventuriers.', order: 2 },
                    { name: '🔨 L\'Atelier', description: 'Présentez vos créations pixel art.', order: 3 },
                    { name: '🤝 Guildes', description: 'Recrutement et diplomatie entre clans.', order: 4 },
                    { name: '🐛 Bugs & Aide', description: 'Signalez des problèmes au Conseil des Sages.', order: 5 },
                ]
            });
        }
    }
}
