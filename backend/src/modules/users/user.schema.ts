import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  displayName: string;

  @Prop()
  avatar: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.OFFLINE })
  status: UserStatus;

  @Prop()
  bio: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  isDisabled: boolean;

  @Prop()
  lastSeen: Date;

  @Prop()
  socketId: string;

  @Prop({ type: [String], default: [] })
  directMessageChannels: string[];

  @Prop({ type: [String], default: [] })
  notificationPreferences: string[];

  @Prop()
  passwordChangedAt: Date;

  @Prop()
  resetPasswordToken: string;

  @Prop()
  resetPasswordExpires: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });
