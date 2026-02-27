import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { EngineModule } from '../engine/engine.module'; // GameLoop & PluginManager

@Module({
    imports: [EngineModule],
    providers: [ChatService, ChatGateway],
    exports: [ChatService]
})
export class ChatModule { }
