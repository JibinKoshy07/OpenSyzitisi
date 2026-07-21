'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chat';
import { channelsService } from '@/services/api';
import { ChatView } from '@/components/chat/chat-view';
import { ChannelHeader } from '@/components/chat/channel-header';
import { Loader2 } from 'lucide-react';

export default function ChannelPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.id as string;
  const { currentChannel, setCurrentChannel } = useChatStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannel();
  }, [channelId]);

  const loadChannel = async () => {
    try {
      const res = await channelsService.getById(channelId);
      setCurrentChannel(res.data);
    } catch (error) {
      console.error('Failed to load channel:', error);
      router.push('/channels');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentChannel) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChannelHeader channel={currentChannel} />
      <ChatView channelId={channelId} channelName={currentChannel.name} />
    </div>
  );
}
