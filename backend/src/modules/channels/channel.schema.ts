import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ChannelType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  DIRECT = 'direct',
}

@Schema({ timestamps: true })
export class Channel extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: ChannelType, default: ChannelType.PUBLIC })
  type: ChannelType;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  pinnedMessages: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastMessageAt: Date;

  @Prop()
  avatar: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  admins: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  invitedUsers: Types.ObjectId[];
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);

ChannelSchema.index({ name: 'text', description: 'text' });
ChannelSchema.index({ type: 1 });
ChannelSchema.index({ members: 1 });
ChannelSchema.index({ createdBy: 1 });
ChannelSchema.index({ lastMessageAt: -1 });
ChannelSchema.index({ createdAt: -1 });
