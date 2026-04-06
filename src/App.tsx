import { useState, useRef, useEffect } from 'react'
import AudioCall from './audio/page/audio';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600&family=Google+Sans+Display:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #202124;
    color: #e8eaed;
    font-family: 'Google Sans', 'Roboto', sans-serif;
  }

  .meet-root {
    min-height: 100vh;
    background: #202124;
    display: flex;
    flex-direction: column;
  }

  /* ── Header ── */
  .meet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px;
    border-bottom: 1px solid #3c4043;
  }
  .meet-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 22px;
    font-weight: 500;
    color: #e8eaed;
    letter-spacing: -0.3px;
  }
  .meet-logo svg { width: 28px; height: 28px; }
  .meet-logo span { color: #8ab4f8; }
  .meet-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .avatar-btn {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4285f4, #34a853);
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 600; color: #fff;
  }

  /* ── Lobby ── */
  .lobby-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 80px;
  }
  .lobby-left { max-width: 520px; flex: 1; }
  .lobby-headline {
    font-family: 'Google Sans Display', sans-serif;
    font-size: 48px;
    font-weight: 400;
    line-height: 1.2;
    color: #e8eaed;
    margin-bottom: 16px;
  }
  .lobby-sub {
    font-size: 16px;
    color: #9aa0a6;
    margin-bottom: 36px;
    line-height: 1.6;
  }
  .input-group { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }
  .input-field { position: relative; }
  .input-field label {
    position: absolute; top: -10px; left: 12px;
    background: #202124; padding: 0 4px;
    font-size: 12px; color: #8ab4f8; font-weight: 500; letter-spacing: 0.4px; z-index: 1;
  }
  .input-field input {
    width: 100%; padding: 16px;
    background: transparent; border: 1.5px solid #5f6368; border-radius: 8px;
    color: #e8eaed; font-size: 15px; font-family: 'Google Sans', sans-serif;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-field input:focus { border-color: #8ab4f8; box-shadow: 0 0 0 3px rgba(138,180,248,0.12); }
  .input-field input::placeholder { color: #5f6368; }
  .cta-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .btn-primary {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 24px; background: #8ab4f8; color: #202124;
    border: none; border-radius: 8px; font-size: 15px;
    font-family: 'Google Sans', sans-serif; font-weight: 600;
    cursor: pointer; transition: background 0.15s, transform 0.1s, box-shadow 0.15s; white-space: nowrap;
  }
  .btn-primary:hover:not(:disabled) { background: #aecbfa; box-shadow: 0 4px 16px rgba(138,180,248,0.3); }
  .btn-primary:active:not(:disabled) { transform: scale(0.98); }
  .btn-primary:disabled { background: #3c4043; color: #5f6368; cursor: not-allowed; }
  .divider-text { color: #5f6368; font-size: 14px; }
  .btn-link {
    background: none; border: 1.5px solid #5f6368; color: #8ab4f8;
    padding: 11px 20px; border-radius: 8px; font-size: 14px;
    font-family: 'Google Sans', sans-serif; font-weight: 500;
    cursor: pointer; transition: border-color 0.15s, background 0.15s;
  }
  .btn-link:hover { border-color: #8ab4f8; background: rgba(138,180,248,0.06); }

  /* ── Preview Card ── */
  .lobby-right {
    flex: 1; max-width: 440px;
    display: flex; flex-direction: column; align-items: center; gap: 16px;
  }
  .preview-card {
    width: 100%; aspect-ratio: 16/10; background: #2d2e31; border-radius: 16px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; position: relative; overflow: hidden; border: 1px solid #3c4043;
  }
  .preview-avatar {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 600; color: #fff;
    box-shadow: 0 8px 24px rgba(66,133,244,0.4);
  }
  .preview-name { font-size: 15px; color: #9aa0a6; }
  .preview-badge {
    position: absolute; top: 12px; left: 12px;
    background: rgba(32,33,36,0.85); border-radius: 6px;
    padding: 4px 10px; font-size: 12px; color: #e8eaed;
    display: flex; align-items: center; gap: 6px;
  }
  .live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ea4335;
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }
  .preview-controls { display: flex; gap: 10px; }
  .ctrl-btn {
    width: 40px; height: 40px; border-radius: 50%; background: #3c4043;
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: #e8eaed; font-size: 16px; transition: background 0.15s;
  }
  .ctrl-btn:hover { background: #4e5155; }

  /* ── Active Call ── */
  .call-wrapper { flex: 1; display: flex; flex-direction: column; min-height: 100vh; }
  .call-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 20px; border-bottom: 1px solid #3c4043;
  }
  .call-title { font-size: 16px; font-weight: 500; color: #e8eaed; }
  .call-time { font-size: 13px; color: #9aa0a6; font-variant-numeric: tabular-nums; }
  .btn-back {
    display: flex; align-items: center; gap: 6px;
    background: rgba(234,67,53,0.12); border: 1px solid rgba(234,67,53,0.3);
    color: #f28b82; padding: 8px 16px; border-radius: 8px;
    font-size: 14px; font-family: 'Google Sans', sans-serif; font-weight: 500;
    cursor: pointer; transition: background 0.15s;
  }
  .btn-back:hover { background: rgba(234,67,53,0.22); }
  .call-content { flex: 1; padding: 20px; }

  /* ── Pill chips ── */
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; background: #3c4043; border-radius: 20px;
    font-size: 13px; color: #9aa0a6;
  }
  .chip-dot { width: 6px; height: 6px; border-radius: 50%; background: #34a853; }

  /* ── Footer ── */
  .meet-footer {
    text-align: center; padding: 16px; font-size: 12px;
    color: #5f6368; border-top: 1px solid #3c4043;
  }
`;

// ✅ FIX 1: useEffect instead of useState for the interval
function CallTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id); // properly cleans up on unmount
  }, []);
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return <span className="call-time">{m}:{s}</span>;
}

function App() {
  const [myId, setMyId]         = useState<string>('');
  const [remoteId, setRemoteId] = useState<string>('');
  const [isJoined, setIsJoined] = useState(false);

  // ✅ FIX 2: hold a ref to AudioCall's endCall so topbar button can trigger it
  const endCallRef = useRef<((isInitiator?: boolean) => void) | null>(null);

  const initials = myId ? myId.slice(0, 2).toUpperCase() : '?';

  // ✅ FIX 3: always stop tracks+peer before navigating back to lobby
  const handleLeave = () => {
    endCallRef.current?.(true); // stops mic + camera + notifies remote
    setIsJoined(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="meet-root">
        {/* Header */}
        <header className="meet-header">
          <div className="meet-logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="#1a73e8"/>
              <path d="M28 20v8l8-4-8-4z" fill="#fff"/>
              <rect x="12" y="16" width="16" height="16" rx="3" fill="#fff" fillOpacity="0.9"/>
            </svg>
            Google <span>Meet</span>
          </div>
          <div className="meet-header-right">
            {myId && <div className="chip"><span className="chip-dot"/> {myId}</div>}
            <button className="avatar-btn">{initials}</button>
          </div>
        </header>

        {!isJoined ? (
          /* ── Lobby ── */
          <div className="lobby-wrapper">
            <div className="lobby-left">
              <h1 className="lobby-headline">Video calls and meetings for everyone</h1>
              <p className="lobby-sub">
                Connect, collaborate and celebrate from anywhere with Google Meet — enter your ID and the person you want to reach.
              </p>
              <div className="input-group">
                <div className="input-field">
                  <label>Your ID</label>
                  <input
                    type="text"
                    placeholder="e.g. user1"
                    value={myId}
                    onChange={e => setMyId(e.target.value)}
                  />
                </div>
                <div className="input-field">
                  <label>Call ID</label>
                  <input
                    type="text"
                    placeholder="e.g. user2"
                    value={remoteId}
                    onChange={e => setRemoteId(e.target.value)}
                  />
                </div>
              </div>
              <div className="cta-row">
                <button
                  className="btn-primary"
                  disabled={!myId || !remoteId}
                  onClick={() => setIsJoined(true)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                  Join now
                </button>
                <span className="divider-text">or</span>
                <button className="btn-link">Get a link to share</button>
              </div>
            </div>

            <div className="lobby-right">
              <div className="preview-card">
                <div className="preview-badge">
                  <span className="live-dot"/>
                  Ready to join
                </div>
                <div className="preview-avatar">{initials}</div>
                <span className="preview-name">{myId || 'Your name'}</span>
              </div>
              <div className="preview-controls">
                <button className="ctrl-btn" title="Mute">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </button>
                <button className="ctrl-btn" title="Camera">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                </button>
                <button className="ctrl-btn" title="Settings">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a6.96 6.96 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.47.47 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Active Call ── */
          <div className="call-wrapper">
            <div className="call-topbar">
              <div className="call-title">{myId} → {remoteId}</div>
              <CallTimer />
              {/* ✅ FIX: handleLeave stops tracks BEFORE unmounting AudioCall */}
              <button className="btn-back" onClick={handleLeave}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.21 2.2z"/>
                </svg>
                Leave call
              </button>
            </div>
            <div className="call-content">
              {/* ✅ FIX: two new props wire App ↔ AudioCall for clean shutdown */}
              <AudioCall
                myId={myId}
                remoteId={remoteId}
                registerEndCall={(fn) => { endCallRef.current = fn; }}
                onCallEnded={() => setIsJoined(false)}
              />
            </div>
          </div>
        )}

        {!isJoined && (
          <footer className="meet-footer">
            © 2025 Google Meet Clone · Built with WebRTC
          </footer>
        )}
      </div>
    </>
  );
}

export default App;