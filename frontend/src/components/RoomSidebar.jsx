import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Shield, Crown, UserCheck, MessageSquare } from 'lucide-react';

export default function RoomSidebar({
  participants,
  currentUser,
  chatHistory,
  onSendMessage,
  onSendReaction,
  onAssignRole,
  onRemoveParticipant,
  onTransferHost
}) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'participants'
  const [msgInput, setMsgInput] = useState('');
  const chatEndRef = useRef(null);

  const isHost = currentUser?.role === 'Host';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    onSendMessage(msgInput);
    setMsgInput('');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Host': return <Crown size={14} color="#f59e0b" />;
      case 'Moderator': return <Shield size={14} color="#8b5cf6" />;
      default: return <UserCheck size={14} color="#94a3b8" />;
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Host': return { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'Moderator': return { background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' };
      default: return { background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' };
    }
  };

  const emojis = ['🔥', '❤️', '😂', '👏', '😮', '🎉'];

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '520px' }}>
      {/* Sidebar Header Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '8px' }}>
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'chat' ? 'rgba(255,255,255,0.08)' : 'transparent',
            border: 'none',
            borderRadius: '10px',
            color: activeTab === 'chat' ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <MessageSquare size={16} /> Live Chat ({chatHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'participants' ? 'rgba(255,255,255,0.08)' : 'transparent',
            border: 'none',
            borderRadius: '10px',
            color: activeTab === 'participants' ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Crown size={16} /> Party ({participants.length})
        </button>
      </div>

      {/* CHAT TAB */}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>
          {/* Chat Messages Log */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.type === 'system' ? 'center' : (msg.senderUserId === currentUser?.userId ? 'flex-end' : 'flex-start'),
                  maxWidth: msg.type === 'system' ? '90%' : '80%'
                }}
              >
                {msg.type === 'system' ? (
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    textAlign: 'center'
                  }}>
                    {msg.message}
                  </div>
                ) : (
                  <div style={{
                    background: msg.senderUserId === currentUser?.userId ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
                    padding: '8px 12px',
                    borderRadius: '14px',
                    borderBottomRightRadius: msg.senderUserId === currentUser?.userId ? '2px' : '14px',
                    borderBottomLeftRadius: msg.senderUserId === currentUser?.userId ? '14px' : '2px',
                    color: '#fff'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginBottom: '2px', fontWeight: 600 }}>
                      {msg.senderUsername} • {msg.timestamp}
                    </div>
                    <div style={{ fontSize: '0.9rem', wordBreak: 'break-word' }}>
                      {msg.message}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Reaction Bar */}
          <div style={{ padding: '6px 12px', display: 'flex', gap: '6px', borderTop: '1px solid var(--border-color)', justifyContent: 'space-between' }}>
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSendReaction(emoji)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  transition: 'transform 0.1s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px', padding: '12px', borderTop: '1px solid var(--border-color)' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Send message..."
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0 16px' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* PARTICIPANTS TAB */}
      {activeTab === 'participants' && (
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Room Members ({participants.length})
          </div>
          {participants.map((p) => {
            const isMe = p.userId === currentUser?.userId;
            return (
              <div
                key={p.userId}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: isMe ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {p.username} {isMe && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(You)</span>}
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      marginTop: '2px',
                      ...getRoleBadgeStyle(p.role)
                    }}>
                      {getRoleIcon(p.role)}
                      <span>{p.role}</span>
                    </div>
                  </div>
                </div>

                {/* Host Control Actions */}
                {isHost && !isMe && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      value={p.role}
                      onChange={(e) => onAssignRole(p.userId, e.target.value)}
                      style={{
                        background: '#0f172a',
                        color: '#fff',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '4px 6px',
                        fontSize: '0.75rem'
                      }}
                    >
                      <option value="Participant">Participant</option>
                      <option value="Moderator">Moderator</option>
                      <option value="Viewer">Viewer</option>
                    </select>

                    <button
                      onClick={() => onTransferHost(p.userId)}
                      title="Transfer Host"
                      style={{
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: 'none',
                        color: '#f59e0b',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      👑 Make Host
                    </button>

                    <button
                      onClick={() => onRemoveParticipant(p.userId)}
                      title="Remove User"
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: 'none',
                        color: '#ef4444',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      ✕ Kick
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
