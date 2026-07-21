import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search all' })
  @ApiQuery({ name: 'q', required: true })
  search(@Query('q') query: string) {
    return this.searchService.search(query, '');
  }

  @Get('users')
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'q', required: true })
  searchUsers(@Query('q') query: string) {
    return this.searchService.searchUsers(query);
  }

  @Get('channels')
  @ApiOperation({ summary: 'Search channels' })
  @ApiQuery({ name: 'q', required: true })
  searchChannels(@Query('q') query: string) {
    return this.searchService.searchChannels(query);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Search messages' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'channelId', required: false })
  searchMessages(@Query('q') query: string, @Query('channelId') channelId?: string) {
    return this.searchService.searchMessages(query, channelId);
  }

  @Get('files')
  @ApiOperation({ summary: 'Search files' })
  @ApiQuery({ name: 'q', required: true })
  searchFiles(@Query('q') query: string) {
    return this.searchService.searchFiles(query);
  }
}
