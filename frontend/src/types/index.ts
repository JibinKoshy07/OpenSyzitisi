export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export enum ChannelType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  DIRECT = 'direct',
}

export enum NotificationType {
  MESSAGE = 'message',
  MENTION = 'mention',
  CHANNEL_INVITE = 'channel_invite',
  REACTION = 'reaction',
  SYSTEM = 'system',
}

export interface User {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  bio?: string;
  isActive: boolean;
  isDisabled: boolean;
  lastSeen?: Date;
  createdAt: Date;
}

export interface Channel {
  _id: string;
  name: string;
  description?: string;
  type: ChannelType;
  members: User[];
  admins?: User[];
  createdBy: User;
  pinnedMessages?: string[];
  isActive: boolean;
  lastMessageAt?: Date;
  avatar?: string;
  memberCount?: number;
}

export interface Message {
  _id: string;
  content: string;
  sender: User;
  channel: string;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  reactions: string[];
  reactionCounts: Record<string, number>;
  readBy: string[];
  attachments: Attachment[];
  replyTo?: Message;
  isSystemMessage: boolean;
  editedAt?: Date;
  createdAt: Date;
  tempId?: string;
}

export interface Attachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

export interface Notification {
  _id: string;
  user: string;
  from?: User;
  channel?: Channel;
  message?: Message;
  type: NotificationType;
  title: string;
  body?: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface SearchResults {
  users: User[];
  channels: Channel[];
  messages: Message[];
  files: File[];
}

export interface Stats {
  users: { total: number; active: number; admins: number };
  channels: { total: number; public: number; private: number; direct: number };
  messages: { total: number; today: number; thisWeek: number };
}
