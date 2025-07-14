import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Button from './Button';
import moment from 'moment-timezone';

const socket = io('http://localhost:5000', { autoConnect: false });

export default function AdminChatBox() {
  const [participants, setParticipants] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const [isClientTyping, setIsClientTyping] = useState(false);
  const typingTimeout = useRef(null);

  useEffect(() => {
    fetchParticipants();
    socket.connect();
    socket.emit('join-admin');

    socket.on('new-message', msg => {
      // Only add if for selected client
      if (
        (msg.sender_role === 'client' && msg.sender_id === selectedClient?.id) ||
        (msg.sender_role === 'admin' && msg.toUserId === selectedClient?.id)
      ) {
        setMessages(m => [...m, msg]);
      }
    });

    return () => {
      socket.off('new-message');
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [selectedClient]);

  useEffect(() => {
    if (selectedClient) fetchMessages(selectedClient.id);
  }, [selectedClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!selectedClient || !socket) return;
    // Listen for client typing events
    const handleClientTyping = data => {
      if (data.userId === selectedClient.id) {
        setIsClientTyping(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsClientTyping(false), 2000);
      }
    };
    socket.on('client-typing', handleClientTyping);
    return () => {
      socket.off('client-typing', handleClientTyping);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [selectedClient, socket]);

  const fetchParticipants = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/chat/participants', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) setParticipants(data.data);
  };

  const fetchMessages = async clientId => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/chat/conversation/${clientId}`, {
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
    if (!input.trim() || !selectedClient) return;

    const messageText = input.trim();
    setInput('');

    // Create message object for immediate display
    const newMessage = {
      message: messageText,
      sender_id: 'admin',
      sender_name: 'Admin',
      sender_role: 'admin',
      toUserId: selectedClient.id,
      created_at: new Date().toISOString(),
    };

    // Add message to local state immediately
    setMessages(m => [...m, newMessage]);

    try {
      // Save to DB
      const token = localStorage.getItem('token');
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: messageText, receiver_id: selectedClient.id })
      });

      // Emit for real-time
      socket.emit('send-message', {
        message: messageText,
        sender_id: 'admin',
        toUserId: selectedClient.id,
        sender_name: 'Admin',
        sender_role: 'admin',
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
    if (socket && selectedClient) {
      socket.emit('typing', { sender_role: 'admin', toUserId: selectedClient.id });
    }
  };

  return (
    <div className="flex gap-4">
      <div className="w-64 bg-white rounded shadow p-2 h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">Clients</h3>
        {participants.map(p => (
          <div
            key={p.id}
            className={`p-2 rounded cursor-pointer ${selectedClient?.id === p.id ? 'bg-primary-100 text-primary-900' : 'hover:bg-gray-100'}`}
            onClick={() => setSelectedClient(p)}
          >
            <div className="font-medium">{p.username}</div>
            <div className="text-xs text-gray-500">{p.email}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 bg-white rounded shadow p-2 flex flex-col h-96">
        <h3 className="font-semibold mb-2">Chat</h3>
        {selectedClient ? (
          <>
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded border border-gray-200 p-2">
              <div className="flex flex-col gap-2">
                {messages.map((msg, i) => {
                  const isAdminMessage = msg.sender_role === 'admin';
                  return (
                    <div key={i} className="mb-2">
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: isAdminMessage ? 'flex-end' : 'flex-start',
                        marginBottom: 4 
                      }}>
                        <div style={{
                          maxWidth: '80%',
                          padding: '8px 12px',
                          borderRadius: 12,
                          background: isAdminMessage ? '#2563eb' : '#e5e7eb',
                          color: isAdminMessage ? 'white' : 'black',
                          wordWrap: 'break-word'
                        }}>
                          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: 2 }}>
                            {msg.sender_name}
                          </div>
                          <div>{msg.message}</div>
                          <div style={{ fontSize: '10px', opacity: 0.7, marginTop: 4, textAlign: isAdminMessage ? 'right' : 'left' }}>
                            {msg.created_at ? moment.utc(msg.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A') : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 mt-2">
              <input
                className="input flex-1"
                placeholder="Type your message..."
                value={input}
                onChange={handleInputChange}
                onBlur={() => socket && selectedClient && socket.emit('stop-typing', { sender_role: 'admin', toUserId: selectedClient.id })}
              />
              <Button type="submit" variant="primary">Send</Button>
            </form>
            {isClientTyping && (
              <div style={{ padding: '0 16px 8px', color: '#2563eb', fontSize: 13, fontWeight: 500 }}>
                Client is typing
                <span className="typing-dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">Select a client to chat</div>
        )}
      </div>
    </div>
  );
} 