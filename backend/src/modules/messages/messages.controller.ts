import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto, UpdateMessageDto, AddReactionDto, SearchMessagesDto } from './dto/message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  create(@Body() createMessageDto: CreateMessageDto, @Request() req: any) {
    return this.messagesService.create(createMessageDto, req.user.id);
  }

  @Get('channel/:channelId')
  @ApiOperation({ summary: 'Get messages for a channel' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'before', required: false, type: String })
  findByChannel(
    @Param('channelId') channelId: string,
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.messagesService.findByChannel(
      channelId,
      req.user.id,
      limit ? parseInt(limit, 10) : 50,
      before,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search messages' })
  search(@Query() searchDto: SearchMessagesDto) {
    return this.messagesService.search(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message by ID' })
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update message' })
  update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req: any,
  ) {
    return this.messagesService.update(id, updateMessageDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete message' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.messagesService.delete(id, req.user.id);
  }

  @Post(':id/reaction')
  @ApiOperation({ summary: 'Add reaction to message' })
  addReaction(
    @Param('id') id: string,
    @Body() addReactionDto: AddReactionDto,
    @Request() req: any,
  ) {
    return this.messagesService.addReaction(id, addReactionDto.emoji, req.user.id);
  }

  @Delete(':id/reaction')
  @ApiOperation({ summary: 'Remove reaction from message' })
  removeReaction(
    @Param('id') id: string,
    @Body() addReactionDto: AddReactionDto,
    @Request() req: any,
  ) {
    return this.messagesService.removeReaction(id, addReactionDto.emoji, req.user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.messagesService.markAsRead(id, req.user.id);
  }
}
