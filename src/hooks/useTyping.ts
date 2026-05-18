import { useCallback, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { socketService } from '../config/socket';
import { setTypingUsers } from '../store/slices/messagesSlice';
import type { AppDispatch } from '../store';

const TYPING_DEBOUNCE_MS = 1500;

export function useTyping(channelId: string, currentUserId: string) {
  const dispatch = useDispatch<AppDispatch>();
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCurrentlyTyping = useRef(false);

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const handleTypingUpdate = (data: { channelId: string; typingUsers: string[] }) => {
      if (data.channelId === channelId) {
        dispatch(setTypingUsers({ channelId, users: data.typingUsers }));
      }
    };

    socket.on('typing:update', handleTypingUpdate);

    return () => {
      socket.off('typing:update', handleTypingUpdate);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [channelId, socketService.socket]);

  const sendTypingStart = useCallback(() => {
    const socket = socketService.socket;
    if (!socket) return;

    if (!isCurrentlyTyping.current) {
      isCurrentlyTyping.current = true;
      socket.emit('typing:start', { channelId, userId: currentUserId });
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isCurrentlyTyping.current = false;
      socket.emit('typing:stop', { channelId, userId: currentUserId });
    }, TYPING_DEBOUNCE_MS);
  }, [channelId, currentUserId, socketService.socket]);

  return { sendTypingStart };
}
