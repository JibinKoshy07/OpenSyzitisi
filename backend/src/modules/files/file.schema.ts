import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class File extends Document {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  path: string;

  @Prop({ type: String, enum: FileType, required: true })
  fileType: FileType;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  uploadedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Channel' })
  channel: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  message: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const FileSchema = SchemaFactory.createForClass(File);

FileSchema.index({ uploadedBy: 1 });
FileSchema.index({ channel: 1 });
FileSchema.index({ fileType: 1 });
FileSchema.index({ createdAt: -1 });
FileSchema.index({ originalName: 'text' });
