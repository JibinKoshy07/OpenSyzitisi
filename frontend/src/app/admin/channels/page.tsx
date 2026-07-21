'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/api';
import { Channel, ChannelType } from '@/types';
import { UserAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { formatFullDate } from '@/lib/utils';
import { Search, Hash, Lock, MessageSquare, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const res = await adminService.getAllChannels();
      setChannels(res.data);
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel? All messages will be lost.')) {
      return;
    }

    try {
      await adminService.deleteChannel(channelId);
      toast.success('Channel deleted successfully');
      loadChannels();
    } catch (error) {
      toast.error('Failed to delete channel');
    }
  };

  const filteredChannels = channels.filter(
    (channel) =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getChannelIcon = (type: ChannelType) => {
    switch (type) {
      case ChannelType.PUBLIC:
        return <Hash className="h-4 w-4 text-muted-foreground" />;
      case ChannelType.PRIVATE:
        return <Lock className="h-4 w-4 text-muted-foreground" />;
      case ChannelType.DIRECT:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: ChannelType) => {
    switch (type) {
      case ChannelType.PUBLIC:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Hash className="h-3 w-3" />
            Public
          </span>
        );
      case ChannelType.PRIVATE:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <Lock className="h-3 w-3" />
            Private
          </span>
        );
      case ChannelType.DIRECT:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <MessageSquare className="h-3 w-3" />
            Direct
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Channels</h1>
        <p className="text-muted-foreground">
          Manage channels across your workspace
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search channels..."
          className="pl-10"
        />
      </div>

      {/* Channels Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredChannels.map((channel) => (
          <div
            key={channel._id}
            className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getChannelIcon(channel.type)}
                <div>
                  <h3 className="font-medium">{channel.name}</h3>
                  {channel.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {channel.description}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleDeleteChannel(channel._id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Channel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTypeBadge(channel.type)}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {channel.members?.slice(0, 3).map((member) => (
                    <UserAvatar
                      key={member._id}
                      src={member.avatar}
                      name={member.displayName || member.username}
                      size="sm"
                      className="border-2 border-background"
                    />
                  ))}
                  {(channel.members?.length || 0) > 3 && (
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium border-2 border-background">
                      +{(channel.members?.length || 0) - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Created by {channel.createdBy?.displayName || channel.createdBy?.username}</span>
                <span>{formatFullDate(channel.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredChannels.length === 0 && !loading && (
        <div className="text-center py-12">
          <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No channels found</p>
        </div>
      )}
    </div>
  );
}
