import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  private userSockets: Map<string, string[]> = new Map();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      client.userId = payload.sub;
      client.username = payload.email;

      await this.chatService.setUserOnline(client.userId, client.id);

      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, []);
      }
      this.userSockets.get(client.userId)!.push(client.id);

      client.join(`user:${client.userId}`);

      this.server.emit('userOnline', { userId: client.userId });

      this.logger.log(`User ${client.userId} connected with socket ${client.id}`);
    } catch (error) {
      this.logger.warn(`Connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      await this.chatService.setUserOffline(client.userId);

      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        const index = sockets.indexOf(client.id);
        if (index > -1) {
          sockets.splice(index, 1);
        }
        if (sockets.length === 0) {
          this.userSockets.delete(client.userId);
          this.server.emit('userOffline', { userId: client.userId });
        }
      }

      this.logger.log(`User ${client.userId} disconnected`);
    }
  }

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    if (!client.userId) return;

    await client.join(`channel:${data.channelId}`);
    this.server.to(`channel:${data.channelId}`).emit('userJoined', {
      userId: client.userId,
      channelId: data.channelId,
    });

    return { success: true };
  }

  @SubscribeMessage('leaveChannel')
  async handleLeaveChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    if (!client.userId) return;

    await client.leave(`channel:${data.channelId}`);
    this.server.to(`channel:${data.channelId}`).emit('userLeft', {
      userId: client.userId,
      channelId: data.channelId,
    });

    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string; content: string; tempId?: string },
  ) {
    if (!client.userId) return null;

    const message = await this.chatService.createMessage(
      client.userId,
      data.channelId,
      data.content,
    );

    this.server.to(`channel:${data.channelId}`).emit('newMessage', {
      ...message,
      tempId: data.tempId,
    });

    const mentionedUsers = this.extractMentions(data.content);
    for (const userId of mentionedUsers) {
      this.server.to(`user:${userId}`).emit('mention', {
        message,
        channelId: data.channelId,
      });
    }

    return message;
  }

  @SubscribeMessage('typingStart')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    if (!client.userId) return;

    client.to(`channel:${data.channelId}`).emit('userTyping', {
      userId: client.userId,
      channelId: data.channelId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typingStop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    if (!client.userId) return;

    client.to(`channel:${data.channelId}`).emit('userTyping', {
      userId: client.userId,
      channelId: data.channelId,
      isTyping: false,
    });
  }

  @SubscribeMessage('addReaction')
  async handleAddReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; emoji: string; channelId: string },
  ) {
    if (!client.userId) return;

    const result = await this.chatService.addReaction(
      client.userId,
      data.messageId,
      data.emoji,
    );

    this.server.to(`channel:${data.channelId}`).emit('reactionAdded', {
      messageId: data.messageId,
      emoji: data.emoji,
      userId: client.userId,
      reactionCounts: result.reactionCounts,
    });
  }

  @SubscribeMessage('removeReaction')
  async handleRemoveReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; emoji: string; channelId: string },
  ) {
    if (!client.userId) return;

    const result = await this.chatService.removeReaction(
      client.userId,
      data.messageId,
      data.emoji,
    );

    this.server.to(`channel:${data.channelId}`).emit('reactionRemoved', {
      messageId: data.messageId,
      emoji: data.emoji,
      userId: client.userId,
      reactionCounts: result.reactionCounts,
    });
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string; messageId: string },
  ) {
    if (!client.userId) return;

    await this.chatService.markAsRead(client.userId, data.messageId);

    this.server.to(`channel:${data.channelId}`).emit('messageRead', {
      messageId: data.messageId,
      userId: client.userId,
    });
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; content: string; channelId: string },
  ) {
    if (!client.userId) return null;

    const message = await this.chatService.editMessage(
      client.userId,
      data.messageId,
      data.content,
    );

    this.server.to(`channel:${data.channelId}`).emit('messageEdited', {
      messageId: data.messageId,
      content: data.content,
      editedAt: message.editedAt,
    });

    return message;
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; channelId: string },
  ) {
    if (!client.userId) return;

    await this.chatService.deleteMessage(client.userId, data.messageId);

    this.server.to(`channel:${data.channelId}`).emit('messageDeleted', {
      messageId: data.messageId,
    });
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);
    return mentions ? mentions.map(m => m.slice(1)) : [];
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToChannel(channelId: string, event: string, data: any) {
    this.server.to(`channel:${channelId}`).emit(event, data);
  }
}
