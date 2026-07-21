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
import { ChannelsService } from './channels.service';
import { CreateChannelDto, UpdateChannelDto, AddMembersDto, AddAdminDto, JoinChannelDto } from './dto/channel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Channels')
@Controller('channels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new channel' })
  create(@Body() createChannelDto: CreateChannelDto, @Request() req: any) {
    return this.channelsService.create(createChannelDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all channels for current user' })
  findAll(@Request() req: any) {
    return this.channelsService.findAll(req.user.id);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get all public channels' })
  findPublicChannels() {
    return this.channelsService.findPublicChannels();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search channels' })
  @ApiQuery({ name: 'q', required: true })
  search(@Query('q') query: string) {
    return this.channelsService.searchChannels(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get channel by ID' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.channelsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update channel' })
  update(
    @Param('id') id: string,
    @Body() updateChannelDto: UpdateChannelDto,
    @Request() req: any,
  ) {
    return this.channelsService.update(id, updateChannelDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete channel' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.channelsService.delete(id, req.user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add members to channel' })
  addMembers(
    @Param('id') id: string,
    @Body() addMembersDto: AddMembersDto,
    @Request() req: any,
  ) {
    return this.channelsService.addMembers(id, addMembersDto, req.user.id);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member from channel' })
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.channelsService.removeMember(id, memberId, req.user.id);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a public channel' })
  join(@Body() joinDto: JoinChannelDto, @Request() req: any) {
    return this.channelsService.join(joinDto.channelId, req.user.id);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave channel' })
  leave(@Param('id') id: string, @Request() req: any) {
    return this.channelsService.leave(id, req.user.id);
  }

  @Post(':id/admins')
  @ApiOperation({ summary: 'Add admin to channel' })
  addAdmin(
    @Param('id') id: string,
    @Body() addAdminDto: AddAdminDto,
    @Request() req: any,
  ) {
    return this.channelsService.addAdmin(id, addAdminDto, req.user.id);
  }

  @Post(':id/pin/:messageId')
  @ApiOperation({ summary: 'Pin a message' })
  pinMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Request() req: any,
  ) {
    return this.channelsService.pinMessage(id, messageId, req.user.id);
  }

  @Delete(':id/pin/:messageId')
  @ApiOperation({ summary: 'Unpin a message' })
  unpinMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Request() req: any,
  ) {
    return this.channelsService.unpinMessage(id, messageId, req.user.id);
  }

  @Get('dm/:userId')
  @ApiOperation({ summary: 'Get or create direct message channel with user' })
  getOrCreateDM(@Param('userId') userId: string, @Request() req: any) {
    return this.channelsService.createDirectMessage(req.user.id, userId);
  }
}
