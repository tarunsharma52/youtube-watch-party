import React, { useState } from 'react';
import { Tv, PlusCircle, LogIn, Sparkles, Film } from 'lucide-react';

export default function Lobby({ onCreateRoom, onJoinRoom }) {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [error, setError] = useState('');

  const sampleVideos = [
    { title: 'Rick Astley - Never Gonna Give You Up', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { title: 'Lofi Hip Hop Radio - Beats to Relax/Study to', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
    { title: 'Big Buck Bunny 4K Trailer', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a display username.');
      return;
    }

    if (mode === 'create') {
      onCreateRoom(username.trim(), videoUrl.trim());
    } else {
      if (!roomCode.trim()) {
        setError('Please enter a valid 6-character room code.');
        return;
      }
      onJoinRoom(roomCode.trim(), username.trim());
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 50%), radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.15), transparent 50%)'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'var(--accent-gradient)',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)'
          }}>
            <Tv size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, tracking: '-0.02em' }}>
            WatchParty <span className="gradient-text">Sync</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
            Watch YouTube videos together in real-time with zero latency playback sync.
          </p>
        </div>

        {/* Action Panel */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          {/* Mode Tabs */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => { setMode('create'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                background: mode === 'create' ? 'var(--accent-primary)' : 'transparent',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <PlusCircle size={16} /> Create Room
            </button>
            <button
              onClick={() => { setMode('join'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                background: mode === 'join' ? 'var(--accent-primary)' : 'transparent',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LogIn size={16} /> Join Room
            </button>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
                Your Username
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Alex"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                required
              />
            </div>

            {mode === 'create' ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
                  Initial YouTube Video URL
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />

                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Or pick a preset:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sampleVideos.map((vid, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setVideoUrl(vid.url)}
                        style={{
                          textAlign: 'left',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: videoUrl === vid.url ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#cbd5e1',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Film size={12} color="var(--accent-secondary)" />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vid.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
                  6-Digit Room Code
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. X7K9A2"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}
                  required
                />
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}>
              <Sparkles size={18} />
              <span>{mode === 'create' ? 'Create Watch Room' : 'Join Watch Room'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
