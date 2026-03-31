import { useState } from 'react'
import './App.css'
import AudioCall from './audio/page/audio';

function App() {
   const [myId, setMyId] = useState<string>('');
  const [remoteId, setRemoteId] = useState<string>('');
  const [isJoined, setIsJoined] = useState(false);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>WebRTC Audio Call</h1>

      {!isJoined ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
          <input
            type="text"
            placeholder="Enter Your ID (e.g., user1)"
            value={myId}
            onChange={(e) => setMyId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter ID to Call (e.g., user2)"
            value={remoteId}
            onChange={(e) => setRemoteId(e.target.value)}
          />
          <button 
            disabled={!myId || !remoteId} 
            onClick={() => setIsJoined(true)}
          >
            Enter Call Lobby
          </button>
        </div>
      ) : (
        <div>
          <button onClick={() => setIsJoined(false)}>← Back</button>
          <hr />
          <AudioCall myId={myId} remoteId={remoteId} />
        </div>
      )}
    </div>
  );
}

export default App
