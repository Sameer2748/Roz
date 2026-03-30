import { io } from 'socket.io-client';
import { API_BASE_URL } from '../constants/api';
import { getItem, StorageKeys } from './storage';

class SocketService {
  socket = null;
  userId = null;
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;

  async connect(userId) {
    if (this.socket?.connected && this.userId === userId) return;
    
    this.userId = userId;
    const token = await getItem(StorageKeys.ACCESS_TOKEN);

    this.socket = io(API_BASE_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
      this.socket.emit('join_user_room', userId);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket:', reason);
    });

    return this.socket;
  }

  on(event, callback) {
    this.socket?.on(event, callback);
  }

  off(event) {
    this.socket?.off(event);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.userId = null;
  }
}

export default new SocketService();
