import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

const AuthContext = createContext({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  loading: true
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.data && data.data.user) {
            setUser(data.data.user);
          } else {
            throw new Error('Invalid response structure');
          }
        })
        .catch(() => {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const updateUser = (newUserData) => {
    setUser(prevUser => ({ ...prevUser, ...newUserData }));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const ChatContext = createContext({
  socket: null,
  newMessage: null,
  notificationCount: 0,
  clearNotifications: () => {},
});

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [newMessage, setNewMessage] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }
    const s = io('http://localhost:5000', { autoConnect: true });
    setSocket(s);
    s.on('connect', () => {
      s.emit('join-client', user.id);
    });
    s.on('new-message', msg => {
      // Only notify if from admin to this client
      if (msg.sender_role === 'admin' && msg.toUserId === user.id) {
        setNewMessage(msg);
        setNotificationCount(c => c + 1);
      }
    });
    return () => {
      s.off('new-message');
      s.disconnect();
      setSocket(null);
    };
  }, [user]);

  const clearNotifications = () => {
    setNotificationCount(0);
    setNewMessage(null);
  };

  return (
    <ChatContext.Provider value={{ socket, newMessage, notificationCount, clearNotifications }}>
      {children}
    </ChatContext.Provider>
  );
}; 