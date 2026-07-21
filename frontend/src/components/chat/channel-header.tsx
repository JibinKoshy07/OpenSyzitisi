'use client';

import React, { useState } from 'react';
import { Hash, Users, Settings, Search, Info, UserPlus } from 'lucide-react';
import { Channel, ChannelType } from '@/types';
import { useChatStore } from '@/store/chat';
import { useAuthStore } from '@/store/auth';
import { usersService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { channelsService } from '@/services/api';

interface ChannelHeaderProps {
  channel: Channel;
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  const { onlineUsers } = useChatStore();
  const { user } = useAuthStore();
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const getOtherDMUser = () => {
    return channel.members?.find((m) => m._id !== user?._id);
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await usersService.search(searchQuery);
      setSearchResults(res.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await channelsService.addMembers(channel._id, [userId]);
      setShowAddMembers(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const handleLeaveChannel = async () => {
    try {
      await channelsService.leave(channel._id);
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to leave channel:', error);
    }
  };

  return (
    <>
      <div className="h-14 flex items-center justify-between px-4 border-b bg-background">
        <div className="flex items-center gap-2">
          {channel.type === ChannelType.DIRECT ? (
            <UserAvatar
              src={channel.members?.[0]?.avatar}
              name={channel.members?.[0]?.displayName || channel.members?.[0]?.username || 'User'}
              size="sm"
              showStatus
              status={onlineUsers.includes(getOtherDMUser()?._id || '') ? 'online' : 'offline'}
            />
          ) : (
            <Hash className="h-5 w-5 text-muted-foreground" />
          )}
          <h2 className="font-semibold">
            {channel.type === ChannelType.DIRECT
              ? getOtherDMUser()?.displayName || getOtherDMUser()?.username
              : channel.name}
          </h2>
          {channel.description && (
            <span className="text-sm text-muted-foreground ml-2">
              — {channel.description}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {channel.type !== ChannelType.DIRECT && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMembers(true)}
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {channel.type !== ChannelType.DIRECT && (
                <>
                  <DropdownMenuItem onClick={() => setShowAddMembers(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Members
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Info className="mr-2 h-4 w-4" />
                    Channel Info
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={handleLeaveChannel} className="text-red-600">
                Leave Channel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Members Sidebar */}
      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Members - {channel.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {channel.members?.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
                >
                  <UserAvatar
                    src={member.avatar}
                    name={member.displayName || member.username}
                    size="md"
                    showStatus
                    status={onlineUsers.includes(member._id) ? 'online' : 'offline'}
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {member.displayName || member.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member._id === channel.createdBy?._id ? 'Owner' : 'Member'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Members Dialog */}
      <Dialog open={showAddMembers} onOpenChange={setShowAddMembers}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
            <DialogDescription>
              Search for users to add to this channel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
              />
              <Button onClick={handleSearchUsers}>Search</Button>
            </div>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        src={user.avatar}
                        name={user.displayName || user.username}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMember(user._id)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
