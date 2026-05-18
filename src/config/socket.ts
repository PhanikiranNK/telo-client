import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from './env';

class SocketService {
  public socket: Socket | null = null;

  // Initialize connection and attach the Firebase JWT token signature
  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SERVER_URL, {
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