import { IsNotEmpty, IsOptional, IsString, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ example: 'Hello, world!' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  channelId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  replyTo?: string;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  attachments?: any[];
}

export class UpdateMessageDto {
  @ApiProperty({ example: 'Updated message content' })
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class AddReactionDto {
  @ApiProperty({ example: 'thumbs_up' })
  @IsNotEmpty()
  @IsString()
  emoji: string;
}

export class MarkReadDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  messageId: string;
}

export class SearchMessagesDto {
  @ApiProperty({ example: 'hello' })
  @IsNotEmpty()
  @IsString()
  query: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  channelId?: string;
}
