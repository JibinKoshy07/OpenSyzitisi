import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './user.schema';
import { CreateUserDto, UpdateUserDto, UpdateUserStatusDto, AdminCreateUserDto, ResetPasswordDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      displayName: createUserDto.displayName || createUserDto.username,
    });

    return user.save();
  }

  async createByAdmin(adminCreateUserDto: AdminCreateUserDto): Promise<User> {
    return this.create(adminCreateUserDto);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).select('-password').exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      { new: true },
    ).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateStatus(id: string, statusDto: UpdateUserStatusDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { status: statusDto.status, lastSeen: new Date() },
      { new: true },
    ).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateLastSeen(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { lastSeen: new Date() });
  }

  async setSocketId(id: string, socketId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { socketId });
  }

  async removeSocketId(socketId: string): Promise<void> {
    await this.userModel.findOneAndUpdate({ socketId }, { socketId: null, status: UserStatus.OFFLINE });
  }

  async disableUser(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { isDisabled: true, status: UserStatus.OFFLINE },
      { new: true },
    ).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async enableUser(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { isDisabled: false },
      { new: true },
    ).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const user = await this.userModel.findById(resetPasswordDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 12);
    await this.userModel.findByIdAndUpdate(resetPasswordDto.userId, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userModel.findByIdAndUpdate(id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.userModel.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    }).select('-password').limit(20).exec();
  }

  async getOnlineUsers(): Promise<User[]> {
    return this.userModel.find({ status: { $ne: UserStatus.OFFLINE } })
      .select('-password')
      .exec();
  }

  async updateAvatar(id: string, avatarPath: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { avatar: avatarPath },
      { new: true },
    ).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async addToDirectMessages(userId: string, channelId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { directMessageChannels: channelId },
    });
  }

  async getStats(): Promise<{ total: number; active: number; admins: number }> {
    const total = await this.userModel.countDocuments();
    const active = await this.userModel.countDocuments({ status: { $ne: UserStatus.OFFLINE } });
    const admins = await this.userModel.countDocuments({ role: UserRole.ADMIN });
    return { total, active, admins };
  }
}
