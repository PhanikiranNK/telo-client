import { useEffect, useState } from 'react';
import { socketService } from '../config/socket';

interface PresenceMap {
  [userId: string]: 'online' | 'away' | 'offline';
}

export function usePresence(channelId: string): PresenceMap {
  const [presenceMap, setPresenceMap] = useState<PresenceMap>({});

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const handlePresenceUpdate = (data: { userId: string; status: 'online' | 'away' | 'offline' }) => {
      setPresenceMap((prev) => ({ ...prev, [data.userId]: data.status }));
    };

    socket.on('presence:update', handlePresenceUpdate);
    socket.emit('presence:join', { channelId });

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
    };
  }, [channelId, socketService.socket]);

  return presenceMap;
}
