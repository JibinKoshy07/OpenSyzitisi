import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationType } from './notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: {
      from?: string;
      channel?: string;
      message?: string;
      link?: string;
    },
  ): Promise<Notification> {
    const notification = new this.notificationModel({
      user: new Types.ObjectId(userId),
      type,
      title,
      body,
      from: data?.from ? new Types.ObjectId(data.from) : undefined,
      channel: data?.channel ? new Types.ObjectId(data.channel) : undefined,
      message: data?.message ? new Types.ObjectId(data.message) : undefined,
      link: data?.link,
    });

    return notification.save();
  }

  async findAll(userId: string, limit: number = 50): Promise<Notification[]> {
    return this.notificationModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('from', 'username displayName avatar')
      .populate('channel', 'name')
      .populate('message', 'content')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findUnread(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ user: new Types.ObjectId(userId), isRead: false })
      .populate('from', 'username displayName avatar')
      .populate('channel', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: id, user: new Types.ObjectId(userId) },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { user: new Types.ObjectId(userId), isRead: false },
      { isRead: true },
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.notificationModel.deleteOne({
      _id: id,
      user: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      user: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  async createMentionNotification(
    userId: string,
    fromUserId: string,
    channelId: string,
    messageId: string,
    channelName: string,
  ): Promise<Notification> {
    return this.create(userId, NotificationType.MENTION, 'You were mentioned', `${channelName}`, {
      from: fromUserId,
      channel: channelId,
      message: messageId,
      link: `/channels/${channelId}/message/${messageId}`,
    });
  }

  async createMessageNotification(
    userId: string,
    fromUserId: string,
    channelId: string,
    messageId: string,
    channelName: string,
  ): Promise<Notification> {
    return this.create(userId, NotificationType.MESSAGE, 'New message', `New message in ${channelName}`, {
      from: fromUserId,
      channel: channelId,
      message: messageId,
      link: `/channels/${channelId}/message/${messageId}`,
    });
  }

  async createChannelInviteNotification(
    userId: string,
    fromUserId: string,
    channelId: string,
    channelName: string,
  ): Promise<Notification> {
    return this.create(userId, NotificationType.CHANNEL_INVITE, 'Channel invite', `You were invited to ${channelName}`, {
      from: fromUserId,
      channel: channelId,
      link: `/channels/${channelId}`,
    });
  }
}
