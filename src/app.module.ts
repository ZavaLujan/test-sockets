import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [ChatModule, ClientsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
