// client/src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import channelsReducer from './slices/channelsSlice';
import messagesReducer from './slices/messagesSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        channels: channelsReducer,
        messages: messagesReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Turn off serialization checks for seamless Firebase Timestamp interactions
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;