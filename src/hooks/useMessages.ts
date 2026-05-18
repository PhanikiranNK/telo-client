// client/src/hooks/useMessages.ts
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { socketService } from '../config/socket';
import { useFeedback } from './useFeedback';
import type { RootState } from '../store';
import type { Message } from '../types';

export const useMessages = (channelId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const currentUser = useSelector((s: RootState) => s.auth.user);

  // Initialize haptic and audio triggers
  const { triggerMessageSent, triggerMessageReceived, triggerErrorNotification } = useFeedback();

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    // Listen for incoming messages from the backend engine
    const handleNewMessage = (incomingMessage: Message) => {
      setMessages((prev) => [...prev, incomingMessage]);

      // 🔔 Trigger the inbound chime and tactile bump only if the message is from another teammate
      if (incomingMessage.senderId !== currentUser?.uid) {
        triggerMessageReceived();
      }
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [channelId, currentUser?.uid]);

  // Function called when the user hits 'Send' in the UI
  const sendMessage = (text: string) => {
    if (!text.trim() || !currentUser) {
      // Empty field error rumble!
      triggerErrorNotification();
      return;
    }

    const socket = socketService.socket;
    if (socket) {
      // Send message along with correct sender credentials to the backend
      socket.emit('message:send', {
        channelId,
        text: text.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName ?? 'Anonymous',
        senderPhoto: currentUser.photoURL ?? undefined,
      });

      // Crisp haptic snap + pop audio immediately on dispatch!
      triggerMessageSent();
    } else {
      triggerErrorNotification();
    }
  };

  return {
    messages,
    sendMessage,
  };
};