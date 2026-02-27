import { Module, OnModuleInit } from '@nestjs/common';
import { SocialService } from './social.service';
import { GuildService } from './guild.service';
import { SocialController } from './social.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [SocialService, GuildService],
    controllers: [SocialController],
    exports: [SocialService, GuildService],
})
export class SocialModule implements OnModuleInit {
    constructor(private readonly socialService: SocialService) { }

    async onModuleInit() {
        await this.socialService.seedForum();
    }
}
