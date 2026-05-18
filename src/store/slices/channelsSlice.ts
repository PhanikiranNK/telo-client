import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Channel } from '../../types';

interface ChannelsState {
  channels: Channel[];
  activeChannelId: string;
}

const initialChannels: Channel[] = [
  { id: 'general', name: 'general', unreadCount: 3, isActive: true, membersOnline: 5 },
  { id: 'engineering', name: 'engineering', unreadCount: 12, isActive: false, membersOnline: 3 },
  { id: 'random', name: 'random', unreadCount: 0, isActive: false, membersOnline: 2 },
  { id: 'design', name: 'design', unreadCount: 1, isActive: false, membersOnline: 1 },
  { id: 'devops', name: 'devops', unreadCount: 5, isActive: false, membersOnline: 2 },
];

const initialState: ChannelsState = {
  channels: initialChannels,
  activeChannelId: 'general',
};

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    setActiveChannel(state, action: PayloadAction<string>) {
      state.activeChannelId = action.payload;
      state.channels = state.channels.map((ch) => ({
        ...ch,
        isActive: ch.id === action.payload,
        // Clear unread when user switches to channel
        unreadCount: ch.id === action.payload ? 0 : ch.unreadCount,
      }));
    },
    incrementUnread(state, action: PayloadAction<string>) {
      const ch = state.channels.find((c) => c.id === action.payload);
      if (ch && ch.id !== state.activeChannelId) {
        ch.unreadCount += 1;
      }
    },
    upsertChannel(state, action: PayloadAction<Channel>) {
      const idx = state.channels.findIndex((c) => c.id === action.payload.id);
      if (idx >= 0) {
        state.channels[idx] = action.payload;
      } else {
        state.channels.push(action.payload);
      }
    },
  },
});

export const { setActiveChannel, incrementUnread, upsertChannel } = channelsSlice.actions;
export default channelsSlice.reducer;
