// ─── Shared TypeScript types for TELO ────────────────────────────────────────

export type UserPresence = 'online' | 'away' | 'offline';

export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  presence: UserPresence;
}

export interface Reaction {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  timestamp: Date;
  reactions: Reaction[];
}

export interface Channel {
  id: string;
  name: string;
  unreadCount: number;
  isActive: boolean;
  membersOnline: number;
}

export interface TaskItem {
  id: string;
  text: string;
  assignee?: string;
  done: boolean;
}
