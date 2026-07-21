'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Hash,
  MessageSquare,
  Users,
  Settings,
  Plus,
  ChevronDown,
  Search,
  Bell,
  LogOut,
  User,
  Shield,
  Volume2,
  VolumeX,
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';
import { useNotificationStore } from '@/store/notification';
import { UserAvatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChannelType, UserStatus } from '@/types';
import { channelsService } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usersService } from '@/services/api';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { channels, setChannels, addChannel, onlineUsers } = useChatStore();
  const { unreadCount } = useNotificationStore();
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [isDark, setIsDark] = useState(true);

  const publicChannels = channels.filter(
    (c) => c.type === ChannelType.PUBLIC || c.type === ChannelType.PRIVATE
  );
  const directMessages = channels.filter((c) => c.type === ChannelType.DIRECT);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const res = await channelsService.getAll();
      setChannels(res.data);
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const handleCreateChannel = async () => {
    try {
      const res = await channelsService.create({
        name: newChannelName,
        description: newChannelDesc,
        type: 'public',
      });
      addChannel(res.data);
      setShowCreateChannel(false);
      setNewChannelName('');
      setNewChannelDesc('');
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  const handleStatusChange = async (status: UserStatus) => {
    try {
      await usersService.updateStatus(status);
      useAuthStore.getState().setUser({ ...user!, status });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={cn('flex flex-col h-full bg-sidebar', className)}>
      {/* Workspace Header */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <h1 className="font-bold text-lg">OpenSyzitisi</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 hover:bg-sidebar-accent rounded-md"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-sidebar-accent rounded-md"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link href="/notifications" className="p-2 hover:bg-sidebar-accent rounded-md relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Channels */}
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Channels
            </span>
            <button
              onClick={() => setShowCreateChannel(true)}
              className="p-1 hover:bg-sidebar-accent rounded"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1">
            {publicChannels.map((channel) => (
              <Link
                key={channel._id}
                href={`/channels/${channel._id}`}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-sidebar-accent transition-colors',
                  pathname === `/channels/${channel._id}` && 'bg-sidebar-accent'
                )}
              >
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span>{channel.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Direct Messages */}
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Direct Messages
            </span>
          </div>
          <div className="space-y-1">
            {directMessages.map((channel) => {
              const otherMember = channel.members?.find(
                (m) => m._id !== user?._id
              );
              return (
                <Link
                  key={channel._id}
                  href={`/channels/${channel._id}`}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-sidebar-accent transition-colors',
                    pathname === `/channels/${channel._id}` && 'bg-sidebar-accent'
                  )}
                >
                  {otherMember ? (
                    <UserAvatar
                      src={otherMember.avatar}
                      name={otherMember.displayName || otherMember.username}
                      size="sm"
                      showStatus
                      status={onlineUsers.includes(otherMember._id) ? 'online' : 'offline'}
                    />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  <span>{otherMember?.displayName || otherMember?.username}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      {/* User Menu */}
      <div className="p-2 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent transition-colors">
              <UserAvatar
                src={user?.avatar}
                name={user?.displayName || user?.username || 'User'}
                size="sm"
                showStatus
                status={(user?.status as any) || 'offline'}
              />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">
                  {user?.displayName || user?.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.status}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            {user?.role === 'admin' && (
              <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                <Shield className="mr-2 h-4 w-4" />
                Admin Dashboard
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleStatusChange(UserStatus.ONLINE)}>
              <span className="mr-2 h-3 w-3 rounded-full bg-green-500" />
              Online
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(UserStatus.AWAY)}>
              <span className="mr-2 h-3 w-3 rounded-full bg-yellow-500" />
              Away
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(UserStatus.BUSY)}>
              <span className="mr-2 h-3 w-3 rounded-full bg-red-500" />
              Busy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(UserStatus.OFFLINE)}>
              <span className="mr-2 h-3 w-3 rounded-full bg-gray-500" />
              Offline
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Channel Dialog */}
      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Channel</DialogTitle>
            <DialogDescription>
              Create a new channel for your team to communicate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Channel Name</label>
              <Input
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="e.g., general"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                value={newChannelDesc}
                onChange={(e) => setNewChannelDesc(e.target.value)}
                placeholder="What's this channel about?"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateChannel(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateChannel} disabled={!newChannelName}>
              Create Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for users, channels, or messages..."
            className="mb-4"
          />
          <div className="max-h-96 overflow-y-auto">
            {/* Search results will be rendered here */}
            <p className="text-sm text-muted-foreground text-center py-8">
              Start typing to search...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
