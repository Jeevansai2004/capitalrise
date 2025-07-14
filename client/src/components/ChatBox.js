import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/AuthContext';
import io from 'socket.io-client';
import Button from './Button';
import moment from 'moment-timezone';

const socket = io('http://localhost:5000', { autoConnect: false });

export default function ChatBox() {
  const { user, token } = useAuth();
  const { socket, notificationCount, clearNotifications } = useChat();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (!user || !socket) return;
    if (!open) return;
    socket.emit('join-client', user.id);
    fetchMessages();
    const handler = msg => {
      if (
        (msg.sender_role === 'admin' && msg.toUserId === user.id) ||
        (msg.sender_role === 'client' && msg.sender_id === user.id)
      ) {
        setMessages(m => [...m, msg]);
      }
    };
    socket.on('new-message', handler);
    return () => {
      socket.off('new-message', handler);
    };
  }, [user, socket, open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) clearNotifications();
  }, [open, clearNotifications]);

  useEffect(() => {
    if (!user || !socket) return;
    // Listen for admin typing events
    const handleAdminTyping = () => {
      setIsAdminTyping(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setIsAdminTyping(false), 2000);
    };
    socket.on('admin-typing', handleAdminTyping);
    return () => {
      socket.off('admin-typing', handleAdminTyping);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [user, socket]);

  const fetchMessages = async () => {
    const res = await fetch('/api/chat/messages', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) setMessages(data.data);
  };

  const sendMessage = async e => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input.trim();
    setInput('');

    // Create message object for immediate display
    const newMessage = {
      message: messageText,
      sender_id: user.id,
      sender_name: user.username,
      sender_role: user.role,
      created_at: new Date().toISOString(),
    };

    // Add message to local state immediately
    setMessages(m => [...m, newMessage]);

    try {
      // Save to DB
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: messageText })
      });

      // Emit for real-time
      socket.emit('send-message', {
        message: messageText,
        sender_id: user.id,
        sender_name: user.username,
        sender_role: user.role,
        created_at: newMessage.created_at
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the message if it failed to send
      setMessages(m => m.filter(msg => msg !== newMessage));
    }
  };

  const handleInputChange = e => {
    setInput(e.target.value);
    if (socket && user) {
      socket.emit('typing', { sender_role: 'client', userId: user.id });
    }
  };

  // Show a small open button when chat is closed
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          width: 64,
          height: 64,
          borderRadius: 12,
          background: '#2563eb',
          color: 'white',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 600,
          cursor: 'pointer',
          letterSpacing: 1,
        }}
        aria-label="Open chat"
      >
        Chat
        {notificationCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
          }}>{notificationCount}</span>
        )}
      </button>
    );
  }

  // Show the chatbox when open
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        width: 350,
        maxWidth: '90vw',
        height: 420,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1001,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: 12, borderBottom: '1px solid #eee', background: '#2563eb', color: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <span style={{ flex: 1, fontWeight: 600 }}>Chat with Admin</span>
        <button
          onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer', marginLeft: 8 }}
          aria-label="Close chat"
        >
          ×
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#f8fafc' }}>
        {messages.map((msg, i) => {
          const isClientMessage = msg.sender_role === 'client' || msg.sender_id === user.id;
          return (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: isClientMessage ? 'flex-end' : 'flex-start',
                marginBottom: 4 
              }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '8px 12px',
                  borderRadius: 12,
                  background: isClientMessage ? '#2563eb' : '#e5e7eb',
                  color: isClientMessage ? 'white' : 'black',
                  wordWrap: 'break-word'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: 2 }}>
                    {msg.sender_name}
                  </div>
                  <div>{msg.message}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, marginTop: 4, textAlign: isClientMessage ? 'right' : 'left' }}>
                    {msg.created_at ? moment.utc(msg.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A') : ''}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', padding: 12, borderTop: '1px solid #eee', background: '#f1f5f9', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
        <input
          value={input}
          onChange={handleInputChange}
          onBlur={() => socket && user && socket.emit('stop-typing', { sender_role: 'client', userId: user.id })}
          style={{ flex: 1, borderRadius: 8, border: '1px solid #ddd', padding: 8, marginRight: 8 }}
          placeholder="Type your message..."
        />
        <Button type="submit">Send</Button>
      </form>
      {isAdminTyping && (
        <div style={{ padding: '0 16px 8px', color: '#2563eb', fontSize: 13, fontWeight: 500 }}>
          Admin is typing
          <span className="typing-dots">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </div>
      )}
    </div>
  );
} 