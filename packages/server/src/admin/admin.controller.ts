import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { Request, Response } from 'express';


@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // --- Live Config ---
    @Get('config')
    async getConfig() {
        return this.adminService.getAllConfig();
    }

    @Post('config/:key')
    async updateConfig(@Param('key') key: string, @Body('value') value: string) {
        return this.adminService.updateConfig(key, value);
    }

    // --- User Management ---
    @Get('users')
    async listUsers() {
        return this.adminService.listUsers();
    }

    @Post('users/:id/role')
    async updateRole(@Param('id') userId: string, @Body('role') role: Role) {
        return this.adminService.updateUserRole(userId, role);
    }

    @Post('users/:id/status')
    async updateStatus(
        @Param('id') userId: string,
        @Body() data: { status: any, banReason?: string, banExpires?: string }
    ) {
        // Conversion de la date si présente
        const expires = data.banExpires ? new Date(data.banExpires) : undefined;
        return this.adminService.updateUserStatus(userId, { ...data, banExpires: expires });
    }

    @Delete('users/:id')
    async deleteUser(@Param('id') userId: string) {
        return this.adminService.deleteUser(userId);
    }
}
