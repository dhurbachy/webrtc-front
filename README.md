

# WebRTC Audio Call Application 📞

A real-time, peer-to-peer audio calling application built with **React**, **TypeScript**, and **Socket.io**. This project demonstrates the implementation of the WebRTC signaling process (Offer/Answer/ICE) to establish direct media streams between users.

## 🚀 Features

- **P2P Audio Streaming**: Direct browser-to-browser voice communication.
- **Real-time Signaling**: Uses Socket.io to exchange connection metadata.
- **Connection Management**: Automated handling of call offers, answers, and ICE candidates.
- **State Feedback**: Visual indicators for "Idle," "Calling," and "Connected" states.
- **Graceful Termination**: Properly stops media tracks and closes peer connections on hang-up.


## 🛠️ Tech Stack

* **Frontend**: React (Hooks, Refs), Tailwind CSS
* **Language**: TypeScript
* **Real-time Communication**: WebRTC API
* **Signaling Server**: Socket.io (Node.js/Express expected)
* **Build Tool**: Vite


## 🏗️ Architecture & Flow

The application follows the standard WebRTC signaling handshake:

1.  **Register**: Both users connect to the signaling server with a unique ID.
2.  **Offer**: User A initiates a call, creating an SDP Offer sent via Socket.io to User B.
3.  **Answer**: User B receives the offer, sets their remote description, and sends back an SDP Answer.
4.  **ICE Candidates**: Both peers exchange network candidates to find the best path for data.
5.  **Stream**: Once connected, the `ontrack` event attaches the remote audio stream to the `<audio>` element.


## 🚦 Getting Started

### 1. Prerequisites
Ensure you have a signaling server running on `http://localhost:3000`. The server should handle the following events:
- `register`
- `offer`
- `answer`
- `ice-candidate`
- `end-call`

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>

# Install dependencies
npm install
```

### 3. Development
```bash
npm run dev
```

### 4. Testing the Call
1.  Open two separate browser tabs at `http://localhost:5173`.
2.  In **Tab 1**, enter ID `user1` and target `user2`. Click **Enter Call Lobby**.
3.  In **Tab 2**, enter ID `user2` and target `user1`. Click **Enter Call Lobby**.
4.  Click **Call user2** from Tab 1.
5.  Accept permissions for the microphone in both tabs.


## 📝 Configuration Note

Currently, the application uses a public Google STUN server:
```typescript
{ urls: "stun:stun.l.google.com:19302" }
```
For production environments or restrictive networks (symmetric NAT), you may need to implement a **TURN server** (like Coturn).

## ⚠️ Known Limitations
- **Localhost Only**: If testing across different devices, ensure you use `https` or configure browser flags, as `getUserMedia` requires a secure context.
- **Single Room**: This setup is designed for 1-to-1 calls based on specific User IDs.
