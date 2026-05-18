import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';

import { Platform } from 'react-native';

const getSocketUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "10.128.57.115:8081"
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5002`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:5002' : 'http://localhost:5002';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  public socket: Socket | null = null;

  // Initialize connection and attach the Firebase JWT token signature
  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'], // Force pure low-latency WebSockets directly
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('⚡ TELO Engine: Real-time socket stream established.');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ TELO Engine Connection Error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 TELO Engine: Real-time stream closed down.');
    }
  }
}

export const socketService = new SocketService();