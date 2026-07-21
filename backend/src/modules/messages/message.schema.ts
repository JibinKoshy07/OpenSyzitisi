import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Channel', required: true })
  channel: Types.ObjectId;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  reactions: Types.ObjectId[];

  @Prop({ type: Map, of: Number, default: {} })
  reactionCounts: Map<string, number>;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  readBy: Types.ObjectId[];

  @Prop({ type: Object })
  attachments: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  }[];

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyTo: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isSystemMessage: boolean;

  @Prop()
  editedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ channel: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ 'attachments.filename': 1 });
MessageSchema.index({ content: 'text' });
