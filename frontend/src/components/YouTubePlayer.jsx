import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ShieldAlert } from 'lucide-react';

export default function YouTubePlayer({
  videoId,
  roomState,
  userRole,
  onStateChange,
  onSeek
}) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const isUpdatingFromSocket = useRef(false);

  const canControl = userRole === 'Host' || userRole === 'Moderator';

  // Load YouTube IFrame API Script dynamically
  useEffect(() => {
    let isSubscribed = true;

    const setupYT = () => {
      if (!isSubscribed) return;
      if (window.YT && window.YT.Player) {
        initPlayer(videoId);
      } else {
        if (!document.getElementById('yt-iframe-api-script')) {
          const tag = document.createElement('script');
          tag.id = 'yt-iframe-api-script';
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        const prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevReady) prevReady();
          if (isSubscribed) initPlayer(videoId);
        };
      }
    };

    setupYT();

    return () => {
      isSubscribed = false;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // Initialize YouTube Player
  const initPlayer = (vId) => {
    if (!window.YT || playerRef.current) return;

    playerRef.current = new window.YT.Player('yt-player-element', {
      videoId: vId || 'dQw4w9WgXcQ',
      playerVars: {
        autoplay: 1,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: (event) => {
          console.log('[YT Player] Ready');
          if (roomState.playState === 'playing') {
            event.target.playVideo();
          } else {
            event.target.pauseVideo();
          }
        },
        onStateChange: (event) => {
          if (isUpdatingFromSocket.current) return;

          // Event state mapping: 1=playing, 2=paused
          if (canControl) {
            const currentTime = event.target.getCurrentTime();
            if (event.data === window.YT.PlayerState.PLAYING) {
              onStateChange('play', currentTime);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              onStateChange('pause', currentTime);
            }
          }
        }
      }
    });
  };

  // Sync Video ID changes
  useEffect(() => {
    if (playerRef.current && videoId) {
      const currentLoadedId = playerRef.current.getVideoData?.()?.video_id;
      if (currentLoadedId !== videoId) {
        isUpdatingFromSocket.current = true;
        playerRef.current.loadVideoById(videoId, roomState.currentTime || 0);
        setTimeout(() => { isUpdatingFromSocket.current = false; }, 1000);
      }
    }
  }, [videoId]);

  // Sync Room Playback State Changes from Server
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.getPlayerState) return;

    isUpdatingFromSocket.current = true;
    const playerTime = playerRef.current.getCurrentTime() || 0;
    const targetTime = roomState.currentTime || 0;

    // Seek if drift is > 1.5 seconds
    if (Math.abs(playerTime - targetTime) > 1.5) {
      playerRef.current.seekTo(targetTime, true);
    }

    if (roomState.playState === 'playing') {
      playerRef.current.playVideo();
    } else if (roomState.playState === 'paused') {
      playerRef.current.pauseVideo();
    }

    setTimeout(() => {
      isUpdatingFromSocket.current = false;
    }, 800);
  }, [roomState]);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden', background: '#000' }}>
      <div id="yt-player-element" style={{ width: '100%', height: '100%' }} />

      {!canControl && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(0, 0, 0, 0.75)',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#cbd5e1',
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <ShieldAlert size={14} color="#f59e0b" />
          <span>Synced by Host / Moderator</span>
        </div>
      )}
    </div>
  );
}
