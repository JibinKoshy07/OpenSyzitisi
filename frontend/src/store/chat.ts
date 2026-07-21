import { create } from 'zustand';
import { Channel, Message, User } from '@/types';

interface ChatState {
  channels: Channel[];
  currentChannel: Channel | null;
  messages: Message[];
  onlineUsers: string[];
  typingUsers: Record<string, { userId: string; isTyping: boolean }[]>;
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (channel: Channel) => void;
  removeChannel: (channelId: string) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  setOnlineUsers: (users: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  setTypingUser: (channelId: string, userId: string, isTyping: boolean) => void;
  clearTypingUsers: (channelId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  channels: [],
  currentChannel: null,
  messages: [],
  onlineUsers: [],
  typingUsers: {},

  setChannels: (channels) => set({ channels }),

  addChannel: (channel) =>
    set((state) => ({ channels: [channel, ...state.channels] })),

  updateChannel: (channel) =>
    set((state) => ({
      channels: state.channels.map((c) =>
        c._id === channel._id ? channel : c
      ),
      currentChannel:
        state.currentChannel?._id === channel._id ? channel : state.currentChannel,
    })),

  removeChannel: (channelId) =>
    set((state) => ({
      channels: state.channels.filter((c) => c._id !== channelId),
      currentChannel:
        state.currentChannel?._id === channelId ? null : state.currentChannel,
    })),

  setCurrentChannel: (channel) => set({ currentChannel: channel }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, ...updates } : m
      ),
    })),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, isDeleted: true, content: '' } : m
      ),
    })),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: [...state.onlineUsers, userId],
    })),

  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((id) => id !== userId),
    })),

  setTypingUser: (channelId, userId, isTyping) =>
    set((state) => {
      const current = state.typingUsers[channelId] || [];
      if (isTyping) {
        if (!current.some((t) => t.userId === userId)) {
          return {
            typingUsers: {
              ...state.typingUsers,
              [channelId]: [...current, { userId, isTyping }],
            },
          };
        }
      } else {
        return {
          typingUsers: {
            ...state.typingUsers,
            [channelId]: current.filter((t) => t.userId !== userId),
          },
        };
      }
      return state;
    }),

  clearTypingUsers: (channelId) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [channelId]: [] },
    })),
}));
