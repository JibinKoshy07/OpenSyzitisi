import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.schema';
import { Channel } from '../channels/channel.schema';
import { Message } from '../messages/message.schema';
import { AdminCreateUserDto, ResetPasswordDto } from '../users/dto/create-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Channel.name) private channelModel: Model<Channel>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private configService: ConfigService,
  ) {}

  async initializeAdmin(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@opensyzitisi.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (!adminPassword) {
      console.log('Admin password not configured, skipping admin creation');
      return;
    }

    const existingAdmin = await this.userModel.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const admin = new this.userModel({
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        displayName: 'Admin',
        role: UserRole.ADMIN,
        isActive: true,
        status: 'online',
      });
      await admin.save();
      console.log(`Admin user created: ${adminEmail}`);
    }
  }

  async getStats(): Promise<{
    users: { total: number; active: number; admins: number };
    channels: { total: number; public: number; private: number; direct: number };
    messages: { total: number; today: number; thisWeek: number };
  }> {
    const [userStats, channelStats, messageStats] = await Promise.all([
      this.getUserStats(),
      this.getChannelStats(),
      this.getMessageStats(),
    ]);

    return {
      users: userStats,
      channels: channelStats,
      messages: messageStats,
    };
  }

  private async getUserStats() {
    const [total, active, admins] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ status: { $ne: 'offline' } }),
      this.userModel.countDocuments({ role: UserRole.ADMIN }),
    ]);
    return { total, active, admins };
  }

  private async getChannelStats() {
    const [total, pub, priv, direct] = await Promise.all([
      this.channelModel.countDocuments({ isActive: true }),
      this.channelModel.countDocuments({ type: 'public', isActive: true }),
      this.channelModel.countDocuments({ type: 'private', isActive: true }),
      this.channelModel.countDocuments({ type: 'direct', isActive: true }),
    ]);
    return { total, public: pub, private: priv, direct };
  }

  private async getMessageStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, todayCount, weekCount] = await Promise.all([
      this.messageModel.countDocuments({ isDeleted: false }),
      this.messageModel.countDocuments({ isDeleted: false, createdAt: { $gte: today } }),
      this.messageModel.countDocuments({ isDeleted: false, createdAt: { $gte: week } }),
    ]);
    return { total, today: todayCount, thisWeek: weekCount };
  }

  async getAllUsers(): Promise<User[]> {
    return this.userModel.find().select('-password').sort({ createdAt: -1 }).exec();
  }

  async createUser(dto: AdminCreateUserDto): Promise<User> {
    const existing = await this.userModel.findOne({
      $or: [{ email: dto.email }, { username: dto.username }],
    });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = new this.userModel({
      ...dto,
      password: hashedPassword,
      displayName: dto.displayName || dto.username,
    });

    return user.save();
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true },
    ).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async resetUserPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.userModel.findById(dto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.userModel.findByIdAndUpdate(dto.userId, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });
  }

  async disableUser(userId: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { isDisabled: true },
      { new: true },
    ).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async enableUser(userId: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { isDisabled: false },
      { new: true },
    ).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new ConflictException('Cannot delete admin user');
    }

    await this.userModel.findByIdAndDelete(userId);
  }

  async getAllChannels(): Promise<Channel[]> {
    return this.channelModel.find({ isActive: true })
      .populate('createdBy', 'username displayName')
      .populate('members', 'username displayName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async deleteChannel(channelId: string): Promise<void> {
    const channel = await this.channelModel.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await this.channelModel.findByIdAndUpdate(channelId, { isActive: false });
    await this.messageModel.deleteMany({ channel: new Types.ObjectId(channelId) });
  }
}
