import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../messages/message.schema';
import { Channel } from '../channels/channel.schema';
import { User, UserStatus } from '../users/user.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Channel.name) private channelModel: Model<Channel>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async setUserOnline(userId: string, socketId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      status: UserStatus.ONLINE,
      socketId,
      lastSeen: new Date(),
    });
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      status: UserStatus.OFFLINE,
      socketId: null,
      lastSeen: new Date(),
    });
  }

  async createMessage(
    userId: string,
    channelId: string,
    content: string,
  ): Promise<Message> {
    const channel = await this.channelModel.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (!channel.members.some(m => m.toString() === userId)) {
      throw new ForbiddenException('You are not a member of this channel');
    }

    const message = new this.messageModel({
      content,
      sender: new Types.ObjectId(userId),
      channel: new Types.ObjectId(channelId),
      readBy: [new Types.ObjectId(userId)],
    });

    const saved = await message.save();
    await this.channelModel.findByIdAndUpdate(channelId, { lastMessageAt: new Date() });

    return this.messageModel
      .findById(saved._id)
      .populate('sender', 'username displayName avatar')
      .exec() as Promise<Message>;
  }

  async addReaction(
    userId: string,
    messageId: string,
    emoji: string,
  ): Promise<Message> {
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

    return this.messageModel.findById(messageId).exec() as Promise<Message>;
  }

  async removeReaction(
    userId: string,
    messageId: string,
    emoji: string,
  ): Promise<Message> {
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

    return this.messageModel.findById(messageId).exec() as Promise<Message>;
  }

  async markAsRead(userId: string, messageId: string): Promise<void> {
    await this.messageModel.findByIdAndUpdate(messageId, {
      $addToSet: { readBy: new Types.ObjectId(userId) },
    });
  }

  async editMessage(
    userId: string,
    messageId: string,
    content: string,
  ): Promise<Message> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    const updated = await this.messageModel.findByIdAndUpdate(
      messageId,
      {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
      { new: true },
    ).exec();

    return updated as Message;
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageModel.findByIdAndUpdate(messageId, { isDeleted: true });
  }
}
