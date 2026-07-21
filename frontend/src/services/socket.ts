import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';
import { useNotificationStore } from '@/store/notification';
import { Message } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  connect() {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken || this.socket?.connected) return;

    this.socket = io(`${SOCKET_URL}/chat`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('userOnline', ({ userId }: { userId: string }) => {
      useChatStore.getState().addOnlineUser(userId);
    });

    this.socket.on('userOffline', ({ userId }: { userId: string }) => {
      useChatStore.getState().removeOnlineUser(userId);
    });

    this.socket.on('newMessage', (message: Message) => {
      const { currentChannel, addMessage } = useChatStore.getState();
      if (currentChannel && message.channel === currentChannel._id) {
        addMessage(message);
      }
    });

    this.socket.on('messageEdited', ({ messageId, content, editedAt }: any) => {
      useChatStore.getState().updateMessage(messageId, {
        content,
        isEdited: true,
        editedAt,
      });
    });

    this.socket.on('messageDeleted', ({ messageId }: { messageId: string }) => {
      useChatStore.getState().removeMessage(messageId);
    });

    this.socket.on('userTyping', ({ userId, channelId, isTyping }: any) => {
      useChatStore.getState().setTypingUser(channelId, userId, isTyping);
    });

    this.socket.on('reactionAdded', ({ messageId, emoji, userId, reactionCounts }: any) => {
      useChatStore.getState().updateMessage(messageId, {
        reactions: [...(useChatStore.getState().messages.find(m => m._id === messageId)?.reactions || []), userId],
        reactionCounts,
      });
    });

    this.socket.on('reactionRemoved', ({ messageId, emoji, userId, reactionCounts }: any) => {
      const message = useChatStore.getState().messages.find(m => m._id === messageId);
      if (message) {
        useChatStore.getState().updateMessage(messageId, {
          reactions: message.reactions.filter((r) => r !== userId),
          reactionCounts,
        });
      }
    });

    this.socket.on('mention', ({ message, channelId }: any) => {
      const notification: any = {
        _id: `temp-${Date.now()}`,
        type: 'mention',
        title: 'You were mentioned',
        body: `in ${channelId}`,
        isRead: false,
        createdAt: new Date(),
      };
      useNotificationStore.getState().addNotification(notification);
    });

    this.socket.on('userJoined', ({ userId, channelId }: any) => {
      console.log(`${userId} joined ${channelId}`);
    });

    this.socket.on('userLeft', ({ userId, channelId }: any) => {
      console.log(`${userId} left ${channelId}`);
    });
  }

  joinChannel(channelId: string) {
    this.socket?.emit('joinChannel', { channelId });
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('leaveChannel', { channelId });
  }

  sendMessage(channelId: string, content: string, tempId?: string) {
    this.socket?.emit('sendMessage', { channelId, content, tempId });
  }

  startTyping(channelId: string) {
    const key = `${channelId}-typing`;
    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key)!);
    }

    this.socket?.emit('typingStart', { channelId });

    const timeout = setTimeout(() => {
      this.stopTyping(channelId);
    }, 3000);

    this.typingTimeouts.set(key, timeout);
  }

  stopTyping(channelId: string) {
    const key = `${channelId}-typing`;
    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key)!);
      this.typingTimeouts.delete(key);
    }
    this.socket?.emit('typingStop', { channelId });
  }

  addReaction(messageId: string, emoji: string, channelId: string) {
    this.socket?.emit('addReaction', { messageId, emoji, channelId });
  }

  removeReaction(messageId: string, emoji: string, channelId: string) {
    this.socket?.emit('removeReaction', { messageId, emoji, channelId });
  }

  markAsRead(channelId: string, messageId: string) {
    this.socket?.emit('markAsRead', { channelId, messageId });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }
}

export const socketService = new SocketService();
