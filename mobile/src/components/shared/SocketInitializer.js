import React, { useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import socketService from '../../services/socket';
import { Alert } from 'react-native';

export default function SocketInitializer({ children }) {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const connectSocket = async () => {
        try {
          await socketService.connect(user.id);
          
          socketService.on('new_notification', (notification) => {
            console.log('Received notification:', notification);
            Alert.alert(notification.title, notification.body);
          });
        } catch (err) {
          console.error('Failed to initialize socket:', err);
        }
      };
      
      connectSocket();
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated, user?.id]);

  return children;
}
