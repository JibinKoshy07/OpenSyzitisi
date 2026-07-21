import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { File, FileType } from './file.schema';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(File.name) private fileModel: Model<File>,
  ) {}

  getFileType(mimetype: string): FileType {
    if (mimetype.startsWith('image/')) return FileType.IMAGE;
    if (mimetype.startsWith('video/')) return FileType.VIDEO;
    if (mimetype.startsWith('audio/')) return FileType.AUDIO;
    if (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('spreadsheet')) {
      return FileType.DOCUMENT;
    }
    return FileType.OTHER;
  }

  async create(
    filename: string,
    originalName: string,
    mimetype: string,
    size: number,
    path: string,
    userId: string,
    channelId?: string,
    messageId?: string,
  ): Promise<File> {
    const file = new this.fileModel({
      filename,
      originalName,
      mimetype,
      size,
      path,
      fileType: this.getFileType(mimetype),
      uploadedBy: new Types.ObjectId(userId),
      channel: channelId ? new Types.ObjectId(channelId) : undefined,
      message: messageId ? new Types.ObjectId(messageId) : undefined,
    });

    return file.save();
  }

  async findAll(userId: string, limit: number = 50): Promise<File[]> {
    return this.fileModel
      .find({ uploadedBy: new Types.ObjectId(userId), isActive: true })
      .populate('uploadedBy', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findByChannel(channelId: string, limit: number = 50): Promise<File[]> {
    return this.fileModel
      .find({ channel: new Types.ObjectId(channelId), isActive: true })
      .populate('uploadedBy', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<File> {
    const file = await this.fileModel
      .findById(id)
      .populate('uploadedBy', 'username displayName avatar')
      .exec();

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async search(query: string, limit: number = 50): Promise<File[]> {
    return this.fileModel
      .find({
        originalName: { $regex: query, $options: 'i' },
        isActive: true,
      })
      .populate('uploadedBy', 'username displayName avatar')
      .populate('channel', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async delete(id: string, userId: string): Promise<void> {
    const file = await this.fileModel.findById(id);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.uploadedBy.toString() !== userId) {
      throw new NotFoundException('You can only delete your own files');
    }

    await this.fileModel.findByIdAndUpdate(id, { isActive: false });
  }

  async getStats(): Promise<{ total: number; totalSize: number; byType: Record<FileType, number> }> {
    const files = await this.fileModel.find({ isActive: true });
    const total = files.length;
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const byType: Record<FileType, number> = {
      [FileType.IMAGE]: 0,
      [FileType.VIDEO]: 0,
      [FileType.DOCUMENT]: 0,
      [FileType.AUDIO]: 0,
      [FileType.OTHER]: 0,
    };

    files.forEach(file => {
      byType[file.fileType]++;
    });

    return { total, totalSize, byType };
  }
}
