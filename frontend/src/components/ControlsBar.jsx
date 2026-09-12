import React, { useState } from 'react';
import { Play, Pause, Video, Link2 } from 'lucide-react';

export default function ControlsBar({
  roomState,
  userRole,
  onPlay,
  onPause,
  onChangeVideo
}) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');

  const canControl = userRole === 'Host' || userRole === 'Moderator';

  const handleVideoSubmit = (e) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) return;
    onChangeVideo(newVideoUrl);
    setNewVideoUrl('');
    setShowVideoModal(false);
  };

  return (
    <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
      {/* Play / Pause Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={roomState.playState === 'playing' ? onPause : onPlay}
          disabled={!canControl}
          className="btn-primary"
          style={{
            padding: '10px 20px',
            opacity: canControl ? 1 : 0.4
          }}
        >
          {roomState.playState === 'playing' ? (
            <>
              <Pause size={18} /> Pause Sync
            </>
          ) : (
            <>
              <Play size={18} /> Play Sync
            </>
          )}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</span>
          <span style={{ fontWeight: 600, color: roomState.playState === 'playing' ? 'var(--success)' : 'var(--warning)', textTransform: 'capitalize' }}>
            ● {roomState.playState}
          </span>
        </div>
      </div>

      {/* Change Video Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => setShowVideoModal(true)}
          disabled={!canControl}
          className="btn-secondary"
          style={{ opacity: canControl ? 1 : 0.5 }}
        >
          <Video size={18} color="#ef4444" />
          <span>Change Video</span>
        </button>
      </div>

      {/* Change Video URL Modal */}
      {showVideoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video color="var(--accent-primary)" /> Change YouTube Video
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Paste any YouTube video link or video ID to update for everyone in the room.
            </p>

            <form onSubmit={handleVideoSubmit}>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowVideoModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
