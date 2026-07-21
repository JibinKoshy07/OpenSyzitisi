import { IsNotEmpty, IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '../channel.schema';

export class CreateChannelDto {
  @ApiProperty({ example: 'general' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'General discussions' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ChannelType })
  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  members?: string[];
}

export class UpdateChannelDto {
  @ApiPropertyOptional({ example: 'General' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class AddMembersDto {
  @ApiProperty({ type: [String] })
  @IsNotEmpty()
  @IsArray()
  memberIds: string[];
}

export class RemoveMemberDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class JoinChannelDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  channelId: string;
}

export class LeaveChannelDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  channelId: string;
}

export class AddAdminDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId: string;
}
