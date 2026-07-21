import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ChannelsService } from '../channels/channels.service';
import { MessagesService } from '../messages/messages.service';
import { FilesService } from '../files/files.service';

export interface SearchResults {
  users: any[];
  channels: any[];
  messages: any[];
  files: any[];
}

@Injectable()
export class SearchService {
  constructor(
    private usersService: UsersService,
    private channelsService: ChannelsService,
    private messagesService: MessagesService,
    private filesService: FilesService,
  ) {}

  async search(query: string, userId: string): Promise<SearchResults> {
    const [users, channels, messages, files] = await Promise.all([
      this.usersService.searchUsers(query),
      this.channelsService.searchChannels(query),
      this.messagesService.search({ query, channelId: undefined }),
      this.filesService.search(query),
    ]);

    return { users, channels, messages, files };
  }

  async searchUsers(query: string) {
    return this.usersService.searchUsers(query);
  }

  async searchChannels(query: string) {
    return this.channelsService.searchChannels(query);
  }

  async searchMessages(query: string, channelId?: string) {
    return this.messagesService.search({ query, channelId });
  }

  async searchFiles(query: string) {
    return this.filesService.search(query);
  }
}
