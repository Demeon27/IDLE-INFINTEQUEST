import { Module } from '@nestjs/common';
import { WorkshopService } from './workshop.service';
import { WorkshopController } from './workshop.controller';
import { EngineModule } from '../engine/engine.module'; // Pour accéder au PluginManager

@Module({
    imports: [EngineModule],
    controllers: [WorkshopController],
    providers: [WorkshopService],
    exports: [WorkshopService]
})
export class WorkshopModule { }
