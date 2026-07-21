'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Edit2,
  Trash2,
  Pin,
  Copy,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chat';
import { useAuthStore } from '@/store/auth';
import { socketService } from '@/services/socket';
import { messagesService } from '@/services/api';
import { Message } from '@/types';
import { UserAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate, formatFullDate } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EmojiPicker from 'emoji-picker-react';
import { useDropzone } from 'react-dropzone';

interface ChatViewProps {
  channelId: string;
  channelName: string;
}

export function ChatView({ channelId, channelName }: ChatViewProps) {
  const { user } = useAuthStore();
  const { messages, setMessages, addMessage, updateMessage, removeMessage, typingUsers } = useChatStore();
  const [newMessage, setNewMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showPicker, setShowPicker] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const typingInChannel = typingUsers[channelId] || [];
  const otherTypingUsers = typingInChannel.filter((t) => t.userId !== user?._id);

  useEffect(() => {
    loadMessages();
    socketService.joinChannel(channelId);

    return () => {
      socketService.leaveChannel(channelId);
      useChatStore.getState().clearTypingUsers(channelId);
    };
  }, [channelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await messagesService.getByChannel(channelId);
      setMessages(res.data.reverse());
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    if (editingMessage) {
      try {
        const res = await messagesService.update(editingMessage._id, newMessage);
        updateMessage(editingMessage._id, res.data);
        setEditingMessage(null);
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    } else {
      const tempId = `temp-${Date.now()}`;
      socketService.sendMessage(channelId, newMessage, tempId);
    }

    setNewMessage('');
    socketService.stopTyping(channelId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    socketService.startTyping(channelId);
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
    inputRef.current?.focus();
  };

  const handleDelete = async (messageId: string) => {
    try {
      await messagesService.delete(messageId);
      removeMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    socketService.addReaction(messageId, emoji, channelId);
    setShowPicker(null);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
          },
          body: formData,
        });
        const data = await res.json();
        socketService.sendMessage(channelId, `[File: ${file.name}]`, undefined);
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: true,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div
        {...getRootProps()}
        className={cn(
          'flex-1 overflow-hidden',
          isDragActive && 'bg-primary/10 border-2 border-dashed border-primary'
        )}
      >
        <input {...getInputProps()} />
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageItem
                key={message._id}
                message={message}
                isOwn={message.sender._id === user?._id}
                onEdit={() => handleEdit(message)}
                onDelete={() => handleDelete(message._id)}
                onReaction={(emoji) => handleReaction(message._id, emoji)}
                onCopy={() => handleCopy(message.content)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Typing Indicator */}
      {otherTypingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-muted-foreground">
          {otherTypingUsers.length === 1
            ? 'Someone is typing...'
            : `${otherTypingUsers.length} people are typing...`}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2 hover:bg-accent rounded-md"
          >
            <Smile className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded-md">
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${channelName}`}
              className="w-full resize-none rounded-md border bg-background px-3 py-2 min-h-[44px] max-h-[200px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={1}
            />
          </div>
          <Button onClick={handleSend} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {showEmoji && (
          <div className="absolute bottom-20 right-4 z-50">
            <EmojiPicker onEmojiClick={(emoji) => {
              setNewMessage((prev) => prev + emoji.emoji);
              setShowEmoji(false);
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReaction: (emoji: string) => void;
  onCopy: () => void;
}

function MessageItem({
  message,
  isOwn,
  onEdit,
  onDelete,
  onReaction,
  onCopy,
}: MessageItemProps) {
  const [showReactions, setShowReactions] = useState(false);

  if (message.isDeleted) {
    return (
      <div className="text-muted-foreground text-sm italic px-12">
        This message was deleted.
      </div>
    );
  }

  return (
    <div
      className={cn('group flex gap-3 px-4 hover:bg-accent/50 rounded-md py-1', isOwn && 'flex-row-reverse')}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      <UserAvatar
        src={message.sender.avatar}
        name={message.sender.displayName || message.sender.username}
        size="md"
      />
      <div className={cn('flex-1', isOwn && 'text-right')}>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm">
            {message.sender.displayName || message.sender.username}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatFullDate(message.createdAt)}
          </span>
          {message.isEdited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
        <p className="text-sm mt-0.5 whitespace-pre-wrap">{message.content}</p>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, idx) => (
              <a
                key={idx}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 bg-accent rounded-md hover:bg-accent/80"
              >
                {attachment.mimetype.startsWith('image/') ? (
                  <img
                    src={attachment.url}
                    alt={attachment.originalName}
                    className="max-w-sm rounded-md"
                  />
                ) : (
                  <span className="text-sm">{attachment.originalName}</span>
                )}
              </a>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactionCounts && Object.keys(message.reactionCounts).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(message.reactionCounts).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReaction(emoji.replace('reaction:', ''))}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent rounded-full text-sm hover:bg-accent/80"
              >
                {emoji.replace('reaction:', '')}
                {count > 0 && <span>{count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message Actions */}
      {showReactions && (
        <div className={cn('flex items-center gap-1', isOwn ? 'order-first' : '')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Smile className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <EmojiPicker onEmojiClick={(emoji) => onReaction(emoji.emoji)} />
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pin className="mr-2 h-4 w-4" />
                Pin
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
