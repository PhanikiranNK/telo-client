import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Message } from '../../types';

interface MessagesState {
  messagesByChannel: Record<string, Message[]>;
  typingUsers: Record<string, string[]>; // channelId → [displayName]
}

// ─── Pre-seeded mock deployment conversation ──────────────────────────────────
const seedMessages: Message[] = [
  {
    id: 'm1',
    channelId: 'engineering',
    senderId: 'alex-uid',
    senderName: 'Alex Chen',
    text: 'Hey team, deploying v2.4.1 to staging now. Should take ~5 mins.',
    timestamp: new Date('2026-05-17T10:00:00Z'),
    reactions: [{ emoji: '👍', count: 3, reactedByMe: false }],
  },
  {
    id: 'm2',
    channelId: 'engineering',
    senderId: 'sam-uid',
    senderName: 'Sam Rivera',
    text: 'Copy that. I\'ll watch the error logs on Datadog. Let me know when it\'s green.',
    timestamp: new Date('2026-05-17T10:01:30Z'),
    reactions: [],
  },
  {
    id: 'm3',
    channelId: 'engineering',
    senderId: 'alex-uid',
    senderName: 'Alex Chen',
    text: 'One sec — the CI pipeline flagged a failing test in auth-service. Investigating.',
    timestamp: new Date('2026-05-17T10:03:10Z'),
    reactions: [{ emoji: '🔍', count: 1, reactedByMe: false }],
  },
  {
    id: 'm4',
    channelId: 'engineering',
    senderId: 'sam-uid',
    senderName: 'Sam Rivera',
    text: 'I see it. The JWT expiry mock wasn\'t updated after the token refresh refactor. I can patch it.',
    timestamp: new Date('2026-05-17T10:04:45Z'),
    reactions: [{ emoji: '❤️', count: 2, reactedByMe: true }],
  },
  {
    id: 'm5',
    channelId: 'engineering',
    senderId: 'alex-uid',
    senderName: 'Alex Chen',
    text: 'Perfect. Once merged, I\'ll re-trigger the pipeline. Also — @Sam can you update the runbook for the new env vars before EOD?',
    timestamp: new Date('2026-05-17T10:06:00Z'),
    reactions: [],
  },
  {
    id: 'm6',
    channelId: 'engineering',
    senderId: 'sam-uid',
    senderName: 'Sam Rivera',
    text: 'On it. I\'ll also add the rollback steps we discussed in standup. Deploying the patch now.',
    timestamp: new Date('2026-05-17T10:07:30Z'),
    reactions: [{ emoji: '🚀', count: 4, reactedByMe: false }],
  },
  {
    id: 'm7',
    channelId: 'engineering',
    senderId: 'alex-uid',
    senderName: 'Alex Chen',
    text: '✅ Pipeline green. v2.4.1 is live on staging. QA team — you\'re up!',
    timestamp: new Date('2026-05-17T10:12:00Z'),
    reactions: [
      { emoji: '🎉', count: 5, reactedByMe: true },
      { emoji: '👏', count: 3, reactedByMe: false },
    ],
  },
  {
    id: 'g1',
    channelId: 'general',
    senderId: 'sam-uid',
    senderName: 'Sam Rivera',
    text: 'Good morning everyone! Weekly sync is at 10am today.',
    timestamp: new Date('2026-05-17T09:00:00Z'),
    reactions: [{ emoji: '👋', count: 6, reactedByMe: false }],
  },
  {
    id: 'g2',
    channelId: 'general',
    senderId: 'alex-uid',
    senderName: 'Alex Chen',
    text: 'Morning! I\'ll share the deploy notes in #engineering after standup.',
    timestamp: new Date('2026-05-17T09:02:00Z'),
    reactions: [],
  },
  {
    id: 'g3',
    channelId: 'general',
    senderId: 'alex-uid',
    senderName: 'Alex Chen',
    text: 'Also — new TELO AI feature is ready for review. Check out the task board!',
    timestamp: new Date('2026-05-17T09:05:00Z'),
    reactions: [{ emoji: '🔥', count: 7, reactedByMe: true }],
  },
];

function groupByChannel(messages: Message[]): Record<string, Message[]> {
  return messages.reduce<Record<string, Message[]>>((acc, msg) => {
    if (!acc[msg.channelId]) acc[msg.channelId] = [];
    acc[msg.channelId].push(msg);
    return acc;
  }, {});
}

const initialState: MessagesState = {
  messagesByChannel: {},
  typingUsers: {},
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<Message>) {
      const { channelId } = action.payload;
      if (!state.messagesByChannel[channelId]) {
        state.messagesByChannel[channelId] = [];
      }
      const message = { ...action.payload };
      if (!message.reactions) {
        message.reactions = [];
      }
      state.messagesByChannel[channelId].push(message);
    },
    toggleReaction(
      state,
      action: PayloadAction<{ channelId: string; messageId: string; emoji: string }>,
    ) {
      const { channelId, messageId, emoji } = action.payload;
      const msgs = state.messagesByChannel[channelId];
      if (!msgs) return;
      const msg = msgs.find((m) => m.id === messageId);
      if (!msg) return;
      if (!msg.reactions) {
        msg.reactions = [];
      }
      const reaction = msg.reactions.find((r) => r.emoji === emoji);
      if (reaction) {
        reaction.reactedByMe = !reaction.reactedByMe;
        reaction.count += reaction.reactedByMe ? 1 : -1;
        if (reaction.count <= 0) {
          msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        msg.reactions.push({ emoji, count: 1, reactedByMe: true });
      }
    },
    setTypingUsers(state, action: PayloadAction<{ channelId: string; users: string[] }>) {
      state.typingUsers[action.payload.channelId] = action.payload.users;
    },
  },
});

export const { addMessage, toggleReaction, setTypingUsers } = messagesSlice.actions;
export default messagesSlice.reducer;
