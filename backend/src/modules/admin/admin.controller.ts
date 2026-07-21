import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminCreateUserDto, ResetPasswordDto } from '../users/dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UserRole } from '../users/user.schema';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a new user' })
  createUser(@Body() dto: AdminCreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:userId/role')
  @ApiOperation({ summary: 'Update user role' })
  updateUserRole(
    @Param('userId') userId: string,
    @Body('role') role: UserRole,
  ) {
    return this.adminService.updateUserRole(userId, role);
  }

  @Post('users/:userId/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  resetPassword(@Param('userId') userId: string, @Body() dto: ResetPasswordDto) {
    return this.adminService.resetUserPassword({ ...dto, userId });
  }

  @Post('users/:userId/disable')
  @ApiOperation({ summary: 'Disable user' })
  disableUser(@Param('userId') userId: string) {
    return this.adminService.disableUser(userId);
  }

  @Post('users/:userId/enable')
  @ApiOperation({ summary: 'Enable user' })
  enableUser(@Param('userId') userId: string) {
    return this.adminService.enableUser(userId);
  }

  @Delete('users/:userId')
  @ApiOperation({ summary: 'Delete user' })
  deleteUser(@Param('userId') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Get('channels')
  @ApiOperation({ summary: 'Get all channels' })
  getAllChannels() {
    return this.adminService.getAllChannels();
  }

  @Delete('channels/:channelId')
  @ApiOperation({ summary: 'Delete channel' })
  deleteChannel(@Param('channelId') channelId: string) {
    return this.adminService.deleteChannel(channelId);
  }
}
