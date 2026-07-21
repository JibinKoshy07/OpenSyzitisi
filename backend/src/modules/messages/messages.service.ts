import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from './message.schema';
import { CreateMessageDto, UpdateMessageDto, SearchMessagesDto } from './dto/message.dto';
import { ChannelsService } from '../channels/channels.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private channelsService: ChannelsService,
  ) {}

  async create(createMessageDto: CreateMessageDto, userId: string): Promise<Message> {
    const channel = await this.channelsService.findOne(createMessageDto.channelId, userId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const message = new this.messageModel({
      content: createMessageDto.content,
      sender: new Types.ObjectId(userId),
      channel: new Types.ObjectId(createMessageDto.channelId),
      attachments: createMessageDto.attachments || [],
      replyTo: createMessageDto.replyTo ? new Types.ObjectId(createMessageDto.replyTo) : undefined,
      readBy: [new Types.ObjectId(userId)],
    });

    const saved = await message.save();
    await this.channelsService.updateLastMessage(createMessageDto.channelId);
    return this.populateMessage(saved);
  }

  async findByChannel(
    channelId: string,
    userId: string,
    limit: number = 50,
    before?: string,
  ): Promise<Message[]> {
    const channel = await this.channelsService.findOne(channelId, userId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const query: any = {
      channel: new Types.ObjectId(channelId),
      isDeleted: false,
    };

    if (before) {
      query._id = { $lt: new Types.ObjectId(before) };
    }

    return this.messageModel
      .find(query)
      .populate('sender', 'username displayName avatar')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messageModel
      .findById(id)
      .populate('sender', 'username displayName avatar')
      .populate('channel', 'name type')
      .exec();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async update(id: string, updateMessageDto: UpdateMessageDto, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(id);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    const updated = await this.messageModel.findByIdAndUpdate(
      id,
      {
        content: updateMessageDto.content,
        isEdited: true,
        editedAt: new Date(),
      },
      { new: true },
    )
      .populate('sender', 'username displayName avatar')
      .exec();

    return updated!;
  }

  async delete(id: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(id);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageModel.findByIdAndUpdate(id, { isDeleted: true });
  }

  async addReaction(messageId: string, emoji: string, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const reactionKey = `reaction:${emoji}`;
    const currentCount = message.reactionCounts.get(reactionKey) || 0;

    await this.messageModel.findByIdAndUpdate(messageId, {
      $addToSet: { reactions: new Types.ObjectId(userId) },
      [`reactionCounts.${reactionKey}`]: currentCount + 1,
    });

    return this.findOne(messageId);
  }

  async removeReaction(messageId: string, emoji: string, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const reactionKey = `reaction:${emoji}`;
    const currentCount = message.reactionCounts.get(reactionKey) || 0;

    await this.messageModel.findByIdAndUpdate(messageId, {
      $pull: { reactions: new Types.ObjectId(userId) },
      [`reactionCounts.${reactionKey}`]: Math.max(0, currentCount - 1),
    });

    return this.findOne(messageId);
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    await this.messageModel.findByIdAndUpdate(messageId, {
      $addToSet: { readBy: new Types.ObjectId(userId) },
    });
  }

  async search(searchDto: SearchMessagesDto): Promise<Message[]> {
    const query: any = {
      content: { $regex: searchDto.query, $options: 'i' },
      isDeleted: false,
    };

    if (searchDto.channelId) {
      query.channel = new Types.ObjectId(searchDto.channelId);
    }

    return this.messageModel
      .find(query)
      .populate('sender', 'username displayName avatar')
      .populate('channel', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async getStats(): Promise<{ total: number; today: number; thisWeek: number }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, today, thisWeek] = await Promise.all([
      this.messageModel.countDocuments({ isDeleted: false }),
      this.messageModel.countDocuments({
        isDeleted: false,
        createdAt: { $gte: todayStart },
      }),
      this.messageModel.countDocuments({
        isDeleted: false,
        createdAt: { $gte: weekStart },
      }),
    ]);

    return { total, today, thisWeek };
  }

  private async populateMessage(message: Message): Promise<Message> {
    return this.messageModel
      .findById(message._id)
      .populate('sender', 'username displayName avatar')
      .populate('replyTo', 'content sender')
      .exec() as Promise<Message>;
  }
}
