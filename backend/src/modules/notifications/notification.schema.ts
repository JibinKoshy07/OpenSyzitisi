import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
  MESSAGE = 'message',
  MENTION = 'mention',
  CHANNEL_INVITE = 'channel_invite',
  REACTION = 'reaction',
  SYSTEM = 'system',
}

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  from: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Channel' })
  channel: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  message: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop()
  body: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  link: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, createdAt: -1 });
