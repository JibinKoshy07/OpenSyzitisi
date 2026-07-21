'use client';

import { Hash, MessageSquare } from 'lucide-react';

export default function ChannelsPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center max-w-md">
        <div className="flex justify-center gap-4 mb-6">
          <div className="p-4 bg-primary/10 rounded-full">
            <Hash className="h-12 w-12 text-primary" />
          </div>
          <div className="p-4 bg-primary/10 rounded-full">
            <MessageSquare className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome to OpenSyzitisi</h1>
        <p className="text-muted-foreground">
          Select a channel from the sidebar or create a new one to start
          chatting with your team.
        </p>
      </div>
    </div>
  );
}
