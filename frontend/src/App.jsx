import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Lobby from './components/Lobby';
import YouTubePlayer from './components/YouTubePlayer';
import ControlsBar from './components/ControlsBar';
import RoomSidebar from './components/RoomSidebar';
import { Tv, Copy, LogOut, Check, Sparkles, ShieldCheck } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function App() {
  const [socket, setSocket] = useState(null);
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [roomState, setRoomState] = useState({ videoId: 'dQw4w9WgXcQ', currentTime: 0, playState: 'paused' });
  const [participants, setParticipants] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState('');

  // Socket Connection Initialization
  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('room_created', (data) => {
      setInRoom(true);
      setRoomId(data.roomId);
      setCurrentUser(data.participant);
      setRoomState(data.roomState);
      setParticipants(data.participants);
      setChatHistory(data.chatHistory || []);
    });

    newSocket.on('room_joined', (data) => {
      setInRoom(true);
      setRoomId(data.roomId);
      setCurrentUser(data.participant);
      setRoomState(data.roomState);
      setParticipants(data.participants);
      setChatHistory(data.chatHistory || []);
    });

    newSocket.on('user_joined', (data) => {
      setParticipants(data.participants);
    });

    newSocket.on('user_left', (data) => {
      setParticipants(data.participants);
    });

    newSocket.on('sync_state', (data) => {
      setRoomState({
        videoId: data.videoId,
        currentTime: data.currentTime,
        playState: data.playState
      });
      if (data.triggeredBy && data.action) {
        showToast(`${data.triggeredBy} triggered ${data.action}`);
      }
    });

    newSocket.on('role_assigned', (data) => {
      setParticipants(data.participants);
      if (currentUser && data.targetUserId === currentUser.userId) {
        setCurrentUser((prev) => ({ ...prev, role: data.newRole }));
        showToast(`Your role has been changed to ${data.newRole}`);
      }
    });

    newSocket.on('host_transferred', (data) => {
      setParticipants(data.participants);
      if (currentUser && data.newHostUserId === currentUser.userId) {
        setCurrentUser((prev) => ({ ...prev, role: 'Host' }));
        showToast('👑 You are now the Host of this Watch Party!');
      }
    });

    newSocket.on('participant_removed', (data) => {
      setParticipants(data.participants);
    });

    newSocket.on('kicked', (data) => {
      alert(data.message);
      handleLeaveRoom();
    });

    newSocket.on('chat_message', (msgObj) => {
      setChatHistory((prev) => [...prev, msgObj]);
    });

    newSocket.on('reaction_triggered', (data) => {
      setReactions((prev) => [...prev, data]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== data.id));
      }, 2500);
    });

    newSocket.on('error_message', (data) => {
      alert(data.message);
    });

    return () => newSocket.close();
  }, []);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleCreateRoom = (username, videoUrl) => {
    socket?.emit('create_room', { username, videoUrl });
  };

  const handleJoinRoom = (code, username) => {
    socket?.emit('join_room', { roomId: code, username });
  };

  const handlePlay = () => {
    socket?.emit('play', {});
  };

  const handlePause = () => {
    socket?.emit('pause', {});
  };

  const handleSeek = (time) => {
    socket?.emit('seek', { time });
  };

  const handleChangeVideo = (videoId) => {
    socket?.emit('change_video', { videoId });
  };

  const handleSendMessage = (message) => {
    socket?.emit('send_message', { message });
  };

  const handleSendReaction = (emoji) => {
    socket?.emit('send_reaction', { emoji });
  };

  const handleAssignRole = (targetUserId, newRole) => {
    socket?.emit('assign_role', { targetUserId, newRole });
  };

  const handleRemoveParticipant = (targetUserId) => {
    socket?.emit('remove_participant', { targetUserId });
  };

  const handleTransferHost = (targetUserId) => {
    socket?.emit('transfer_host', { targetUserId });
  };

  const handleLeaveRoom = () => {
    socket?.emit('leave_room');
    setInRoom(false);
    setRoomId('');
    setCurrentUser(null);
    setParticipants([]);
    setChatHistory([]);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inRoom) {
    return <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
  }

  return (
    <div style={{ minHeight: '100vh', padding: '16px 24px', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header className="glass-panel" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: 'var(--accent-gradient)', borderRadius: '10px', display: 'flex' }}>
            <Tv size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>WatchParty Sync</h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
              Live Connected • {participants.length} Member{participants.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Room Code & Invite Share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '6px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Room Code:</span>
            <span style={{ fontWeight: 700, letterSpacing: '0.05em', color: 'var(--accent-secondary)' }}>{roomId}</span>
            <button
              onClick={copyRoomCode}
              style={{ background: 'none', border: 'none', color: copied ? 'var(--success)' : '#fff', cursor: 'pointer', display: 'flex' }}
              title="Copy Room Code"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <button onClick={handleLeaveRoom} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <LogOut size={16} /> Leave Room
          </button>
        </div>
      </header>

      {/* Notification Toast Alert */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '32px',
          background: 'rgba(139, 92, 246, 0.9)',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: '10px',
          fontSize: '0.85rem',
          fontWeight: 500,
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={16} /> {notification}
        </div>
      )}

      {/* Main Grid View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', flex: 1 }}>
        {/* Left Column: Player & Playback Control Bar */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'relative' }}>
            <YouTubePlayer
              videoId={roomState.videoId}
              roomState={roomState}
              userRole={currentUser?.role}
              onStateChange={(action, currentTime) => {
                if (action === 'play') socket?.emit('play', { currentTime });
                if (action === 'pause') socket?.emit('pause', { currentTime });
              }}
              onSeek={handleSeek}
            />

            {/* Reaction Floaters Overlay */}
            {reactions.map((r, i) => (
              <div key={r.id} className="reaction-bubble" style={{ left: `${20 + (i * 15) % 60}%` }}>
                {r.emoji}
              </div>
            ))}
          </div>

          <ControlsBar
            roomState={roomState}
            userRole={currentUser?.role}
            onPlay={handlePlay}
            onPause={handlePause}
            onChangeVideo={handleChangeVideo}
          />
        </div>

        {/* Right Column: Chat, Members & Host Management Panel */}
        <div>
          <RoomSidebar
            participants={participants}
            currentUser={currentUser}
            chatHistory={chatHistory}
            onSendMessage={handleSendMessage}
            onSendReaction={handleSendReaction}
            onAssignRole={handleAssignRole}
            onRemoveParticipant={handleRemoveParticipant}
            onTransferHost={handleTransferHost}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
