import { Controller, Get } from '@nestjs/common';

/**
 * Health Check — Point de contrôle pour Docker, load balancers, et monitoring.
 * GET /api/health → { status: 'ok', timestamp, uptime }
 */
@Controller('health')
export class HealthController {
    @Get()
    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '2.0.0',
            service: 'idle-infinite-quest',
        };
    }
}
