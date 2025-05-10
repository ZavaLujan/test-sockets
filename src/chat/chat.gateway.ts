import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  // Map para llevar socket → room (opcional, si manejas múltiples salas)
  private userRoom = new Map<string, string>();

  async handleConnection(client: Socket) {
    // Por ejemplo: cliente se une a una “room” pasada por query
    const { roomId, userId } = client.handshake.query as {
      roomId?: string;
      userId?: string;
    };

    const safeRoomId = typeof roomId === 'string' ? roomId : String(roomId);

    await client.join(safeRoomId);

    this.userRoom.set(client.id, safeRoomId);

    console.log(`User ${userId} connected to room ${safeRoomId}`);
  }

  handleDisconnect(client: Socket) {
    this.userRoom.delete(client.id);
  }

  // Evento cuando el cliente teclea
  @SubscribeMessage('typing')
  handleTyping(client: Socket) {
    const roomId = this.userRoom.get(client.id);

    // Emitir a todos excepto quien originó
    if (roomId) {
      client
        .to(roomId)
        .emit('user_typing', { userId: client.id, typing: true });
    }
  }

  // Evento cuando deja de teclear
  @SubscribeMessage('stop_typing')
  handleStopTyping(client: Socket) {
    const roomId = this.userRoom.get(client.id);

    if (roomId) {
      client
        .to(roomId)
        .emit('user_typing', { userId: client.id, typing: false });
    }
  }
}
