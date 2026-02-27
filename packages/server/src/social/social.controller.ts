import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SocialService } from './social.service';
import { GuildService } from './guild.service';

@Controller('social')
export class SocialController {
    constructor(
        private readonly socialService: SocialService,
        private readonly guildService: GuildService
    ) { }

    // --- FORUM ---
    @Get('forum/categories')
    async getCategories() {
        return this.socialService.getCategories();
    }

    @Get('forum/category/:id/topics')
    async getTopics(@Param('id') categoryId: string) {
        return this.socialService.getTopics(categoryId);
    }

    @Get('forum/topic/:id')
    async getTopic(@Param('id') topicId: string) {
        return this.socialService.getTopicWithPosts(topicId);
    }

    @Post('forum/topic')
    async createTopic(@Body() body: { authorId: string, categoryId: string, title: string, content: string }) {
        return this.socialService.createTopic(body.authorId, body.categoryId, body.title, body.content);
    }

    @Post('forum/topic/:id/post')
    async addPost(@Param('id') topicId: string, @Body() body: { authorId: string, content: string }) {
        return this.socialService.addPost(body.authorId, topicId, body.content);
    }

    // --- GUILDES ---
    @Get('guilds')
    async listGuilds() {
        return this.guildService.listGuilds();
    }

    @Get('guild/:id')
    async getGuild(@Param('id') guildId: string) {
        return this.guildService.getGuildDetails(guildId);
    }

    @Post('guild/create')
    async createGuild(@Body() body: { ownerId: string, name: string, description?: string }) {
        return this.guildService.createGuild(body.ownerId, body.name, body.description);
    }

    @Post('guild/:id/join')
    async joinGuild(@Param('id') guildId: string, @Body('userId') userId: string) {
        return this.guildService.joinGuild(userId, guildId);
    }

    @Post('guild/leave')
    async leaveGuild(@Body('userId') userId: string) {
        return this.guildService.leaveGuild(userId);
    }
}
