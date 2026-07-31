import React, { createContext, useEffect, useState, ReactNode, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { AuthContext } from './AuthContext';

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket: Socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO Connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO Disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
