import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DungeonService } from './dungeon.service';
import { MonsterCategory } from '@prisma/client';

@Controller('dungeons')
export class DungeonController {
    constructor(private readonly dungeonService: DungeonService) { }

    @Get()
    async listDungeons() {
        return this.dungeonService.listDungeons();
    }

    @Get(':id')
    async getDungeon(@Param('id') id: string) {
        return this.dungeonService.getDungeonDetails(id);
    }

    @Post('monster')
    async createMonster(@Body() body: any) {
        return this.dungeonService.createMonsterTemplate(body);
    }

    @Post('create')
    async createDungeon(@Body() body: any) {
        return this.dungeonService.createDungeonTemplate(body);
    }

    @Get('scale/:tier/:category')
    async getScaling(@Param('tier') tier: string, @Param('category') category: MonsterCategory) {
        return this.dungeonService.calculateScaling(parseInt(tier), category);
    }
}
