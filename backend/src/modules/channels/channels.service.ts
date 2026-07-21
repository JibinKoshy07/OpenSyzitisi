import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Channel, ChannelType } from './channel.schema';
import { CreateChannelDto, UpdateChannelDto, AddMembersDto, AddAdminDto } from './dto/channel.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel(Channel.name) private channelModel: Model<Channel>,
    private usersService: UsersService,
  ) {}

  async create(createChannelDto: CreateChannelDto, userId: string): Promise<Channel> {
    const existingChannel = await this.channelModel.findOne({ name: createChannelDto.name });
    if (existingChannel) {
      throw new BadRequestException('Channel with this name already exists');
    }

    const channel = new this.channelModel({
      ...createChannelDto,
      createdBy: new Types.ObjectId(userId),
      members: [new Types.ObjectId(userId)],
      admins: [new Types.ObjectId(userId)],
    });

    return channel.save();
  }

  async findAll(userId: string): Promise<Channel[]> {
    return this.channelModel.find({
      members: new Types.ObjectId(userId),
      isActive: true,
    })
      .populate('createdBy', 'username displayName avatar')
      .populate('members', 'username displayName avatar status')
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  async findPublicChannels(): Promise<Channel[]> {
    return this.channelModel.find({
      type: ChannelType.PUBLIC,
      isActive: true,
    })
      .populate('createdBy', 'username displayName avatar')
      .select('name description type createdBy memberCount createdAt')
      .exec();
  }

  async findOne(id: string, userId: string): Promise<Channel> {
    const channel = await this.channelModel.findById(id)
      .populate('createdBy', 'username displayName avatar')
      .populate('members', 'username displayName avatar status')
      .populate('admins', 'username displayName avatar')
      .exec();

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.type === ChannelType.PRIVATE && 
        !channel.members.some(m => m._id.toString() === userId)) {
      throw new ForbiddenException('You are not a member of this channel');
    }

    return channel;
  }

  async update(id: string, updateChannelDto: UpdateChannelDto, userId: string): Promise<Channel> {
    const channel = await this.channelModel.findById(id);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (!channel.admins.some(a => a.toString() === userId)) {
      throw new ForbiddenException('Only channel admins can update the channel');
    }

    const updated = await this.channelModel.findByIdAndUpdate(
      id,
      updateChannelDto,
      { new: true },
    )
      .populate('createdBy', 'username displayName avatar')
      .populate('members', 'username displayName avatar status')
      .exec();

    return updated!;
  }

  async delete(id: string, userId: string): Promise<void> {
    const channel = await this.channelModel.findById(id);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.createdBy.toString() !== userId) {
      throw new ForbiddenException('Only the channel creator can delete the channel');
    }

    await this.channelModel.findByIdAndUpdate(id, { isActive: false });
  }

  async addMembers(id: string, addMembersDto: AddMembersDto, userId: string): Promise<Channel> {
    const channel = await this.channelModel.findById(id);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (!channel.admins.some(a => a.toString() === userId)) {
      throw new ForbiddenException('Only channel admins can add members');
    }

    const memberIds = addMembersDto.memberIds.map(m => new Types.ObjectId(m));
    
    const updated = await this.channelModel.findByIdAndUpdate(
      id,
      { $addToSet: { members: { $each: memberIds } } },
      { new: true },
    )
      .populate('members', 'username displayName avatar status')
      .exec();

    return updated!;
  }

  async removeMember(id: string, memberId: string, userId: string): Promise<Channel> {
    const channel = await this.channelModel.findById(id);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (!channel.admins.some(a => a.toString() === userId) && userId !== memberId) {
      throw new ForbiddenException('You cannot remove this member');
    }

    if (memberId === channel.createdBy.toString()) {
      throw new BadRequestException('Cannot remove the channel creator');
    }

    const updated = await this.channelModel.findByIdAndUpdate(
      id,
      { $pull: { members: new Types.ObjectId(memberId), admins: new Types.ObjectId(memberId) } },
      { new: true },
    )
      .populate('members', 'username displayName avatar status')
      .exec();

    return updated!;
  }

  async join(id: string, userId: string): Promise<Channel> {
    const channel = await this.channelModel.findById(id);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.type === ChannelType.PRIVATE) {
      throw new ForbiddenException('Cannot join private channel without invite');
    }

    if (channel.members.some(m => m.toString() === userId)) {
      throw new BadRequestException('Already a member of this channel');
    }

    const updated = await this.channelModel.findByIdAndUpdate(
      id,
      { $addToSet: { members: new Types.ObjectId(userId) } },
      { new: true },
    )
      .populate('members', 'username displayName avatar status')
      .exec();

    await this.usersService.addToDirectMessages(userId, id);
    return updated!;
  }

  async leave(id: string, userId: string): Promise<void> {
    const channel = await this.channelModel.findById(id);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.createdBy.toString() === userId) {
      throw new BadRequestException('Channel creator cannot leave the channel');
    }

    await this.channelModel.findByIdAndUpdate(
      id,
      { $pull: { members: new Types.ObjectId(userId), admins: new Types.ObjectId(userId) } },
    );
  }

  async addAdmin(id: string, addAdminDto: AddAdminDto, userId: string): Promise<Channel> {
    const channel = await this.channelModel.findById(id);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (!channel.admins.some(a => a.toString() === userId)) {
      throw new ForbiddenException('Only channel admins can add admins');
    }

    const updated = await this.channelModel.findByIdAndUpdate(
      id,
      { $addToSet: { admins: new Types.ObjectId(addAdminDto.userId) } },
      { new: true },
    )
      .populate('admins', 'username displayName avatar')
      .exec();

    return updated!;
  }

  async createDirectMessage(userId1: string, userId2: string): Promise<Channel> {
    const existingChannel = await this.channelModel.findOne({
      type: ChannelType.DIRECT,
      $and: [
        { members: new Types.ObjectId(userId1) },
        { members: new Types.ObjectId(userId2) },
      ],
    });

    if (existingChannel) {
      return existingChannel;
    }

    const channel = new this.channelModel({
      name: `dm-${userId1}-${userId2}`,
      type: ChannelType.DIRECT,
      members: [new Types.ObjectId(userId1), new Types.ObjectId(userId2)],
      createdBy: new Types.ObjectId(userId1),
      admins: [new Types.ObjectId(userId1), new Types.ObjectId(userId2)],
    });

    const saved = await channel.save();
    await this.usersService.addToDirectMessages(userId1, saved._id.toString());
    await this.usersService.addToDirectMessages(userId2, saved._id.toString());
    return saved;
  }

  async searchChannels(query: string): Promise<Channel[]> {
    return this.channelModel.find({
      name: { $regex: query, $options: 'i' },
      type: ChannelType.PUBLIC,
      isActive: true,
    })
      .select('name description type memberCount createdAt')
      .limit(20)
      .exec();
  }

  async updateLastMessage(id: string): Promise<void> {
    await this.channelModel.findByIdAndUpdate(id, { lastMessageAt: new Date() });
  }

  async getStats(): Promise<{ total: number; public: number; private: number; direct: number }> {
    const [total, publicCount, privateCount, directCount] = await Promise.all([
      this.channelModel.countDocuments({ isActive: true }),
      this.channelModel.countDocuments({ type: ChannelType.PUBLIC, isActive: true }),
      this.channelModel.countDocuments({ type: ChannelType.PRIVATE, isActive: true }),
      this.channelModel.countDocuments({ type: ChannelType.DIRECT, isActive: true }),
    ]);
    return { total, public: publicCount, private: privateCount, direct: directCount };
  }

  async pinMessage(channelId: string, messageId: string, userId: string): Promise<Channel> {
    const channel = await this.channelModel.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (!channel.admins.some(a => a.toString() === userId)) {
      throw new ForbiddenException('Only channel admins can pin messages');
    }

    const updated = await this.channelModel.findByIdAndUpdate(
      channelId,
      { $addToSet: { pinnedMessages: messageId } },
      { new: true },
    ).exec();

    return updated!;
  }

  async unpinMessage(channelId: string, messageId: string, userId: string): Promise<Channel> {
    const channel = await this.channelModel.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (!channel.admins.some(a => a.toString() === userId)) {
      throw new ForbiddenException('Only channel admins can unpin messages');
    }

    const updated = await this.channelModel.findByIdAndUpdate(
      channelId,
      { $pull: { pinnedMessages: messageId } },
      { new: true },
    ).exec();

    return updated!;
  }
}
