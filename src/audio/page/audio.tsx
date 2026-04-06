import React, { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { SignalingMessage } from "../types/audio";

interface Props {
  myId: string;
  remoteId: string;
  // ✅ FIX: two new props so App can control shutdown from outside
  registerEndCall?: (fn: (isInitiator?: boolean) => void) => void;
  onCallEnded?: () => void;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600&display=swap');

  .call-ui * { box-sizing: border-box; font-family: 'Google Sans', sans-serif; }

  .call-stage {
    position: relative;
    width: 100%;
    background: #1a1b1e;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 480px;
  }

  .remote-video {
    width: 100%; height: 100%; min-height: 480px;
    object-fit: cover; display: block;
    background: #1a1b1e; border-radius: 16px;
  }

  .remote-avatar {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 14px; background: #1a1b1e; z-index: 1;
  }
  .avatar-circle {
    width: 96px; height: 96px; border-radius: 50%;
    background: linear-gradient(135deg, #4285f4, #34a853);
    display: flex; align-items: center; justify-content: center;
    font-size: 36px; font-weight: 600; color: #fff;
    box-shadow: 0 8px 32px rgba(66,133,244,0.45);
  }
  .avatar-name { font-size: 18px; color: #9aa0a6; font-weight: 500; }

  .precall-overlay {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 20px; background: rgba(26,27,30,0.92);
    backdrop-filter: blur(6px); z-index: 10; border-radius: 16px;
  }
  .precall-text { font-size: 20px; color: #e8eaed; font-weight: 500; }
  .precall-sub  { font-size: 14px; color: #9aa0a6; margin-top: -12px; }
  .btn-start-call {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 32px; background: #34a853; color: #fff;
    border: none; border-radius: 50px;
    font-size: 16px; font-family: 'Google Sans', sans-serif;
    font-weight: 600; cursor: pointer;
    box-shadow: 0 6px 24px rgba(52,168,83,0.4);
    transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
  }
  .btn-start-call:hover { background: #46c464; box-shadow: 0 8px 28px rgba(52,168,83,0.55); }
  .btn-start-call:active { transform: scale(0.97); }

  .self-view {
    position: absolute; bottom: 80px; right: 16px;
    width: 180px; aspect-ratio: 16/9;
    border-radius: 12px; overflow: hidden;
    border: 2px solid rgba(255,255,255,0.15);
    background: #2d2e31; z-index: 5;
    box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    transition: width 0.2s;
  }
  .self-view:hover { width: 220px; }
  .self-video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
  .self-avatar { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #2d2e31; font-size: 28px; font-weight: 700; color: #8ab4f8; }
  .self-label { position: absolute; bottom: 6px; left: 8px; background: rgba(0,0,0,0.7); color: #e8eaed; font-size: 11px; padding: 2px 8px; border-radius: 4px; }

  .status-badge {
    position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 8px;
    background: rgba(32,33,36,0.88); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
    padding: 6px 16px; font-size: 13px; color: #e8eaed; z-index: 6;
  }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #34a853; animation: pulse 1.8s ease-in-out infinite; }
  .status-dot.idle { background: #9aa0a6; animation: none; }
  @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(.75); } }

  .control-bar {
    position: absolute; bottom: 0; left: 0; right: 0; height: 72px;
    display: flex; align-items: center; justify-content: center; gap: 12px;
    background: linear-gradient(transparent, rgba(0,0,0,0.72));
    border-radius: 0 0 16px 16px; padding: 0 20px; z-index: 8;
    opacity: 0; transition: opacity 0.22s;
  }
  .call-stage:hover .control-bar, .control-bar.always-show { opacity: 1; }

  .ctrl {
    width: 48px; height: 48px; border-radius: 50%; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 20px;
    transition: background 0.15s, transform 0.1s; position: relative;
  }
  .ctrl:active { transform: scale(0.92); }
  .ctrl-default { background: rgba(255,255,255,0.12); color: #e8eaed; }
  .ctrl-default:hover { background: rgba(255,255,255,0.22); }
  .ctrl-off { background: rgba(234,67,53,0.18); color: #f28b82; border: 1.5px solid rgba(234,67,53,0.35); }
  .ctrl-off:hover { background: rgba(234,67,53,0.3); }
  .ctrl-end { background: #ea4335; color: #fff; width: 56px; height: 56px; font-size: 22px; box-shadow: 0 4px 20px rgba(234,67,53,0.5); }
  .ctrl-end:hover { background: #d93025; box-shadow: 0 6px 24px rgba(234,67,53,0.7); }

  .ctrl-tooltip {
    position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%);
    background: rgba(32,33,36,0.95); color: #e8eaed; font-size: 11px; white-space: nowrap;
    padding: 4px 10px; border-radius: 6px; pointer-events: none;
    opacity: 0; transition: opacity 0.15s;
  }
  .ctrl:hover .ctrl-tooltip { opacity: 1; }

  @keyframes ring {
    0%,100% { transform: rotate(0deg); } 20% { transform: rotate(-15deg); }
    40% { transform: rotate(15deg); } 60% { transform: rotate(-10deg); } 80% { transform: rotate(10deg); }
  }
  .ringing { animation: ring 0.7s ease-in-out infinite; display: inline-block; }
  .dots span { display: inline-block; animation: blink 1.4s infinite both; font-size: 20px; }
  .dots span:nth-child(2) { animation-delay: .2s; }
  .dots span:nth-child(3) { animation-delay: .4s; }
  @keyframes blink { 0%,80%,100% { opacity:0; } 40% { opacity:1; } }
`;

type CallPhase = "idle" | "calling" | "connected";

const AudioCall: React.FC<Props> = ({ myId, remoteId, registerEndCall, onCallEnded }) => {
  const [phase, setPhase]             = useState<CallPhase>("idle");
  const [micOn, setMicOn]             = useState(true);
  const [camOn, setCamOn]             = useState(true);
  const [remoteVideo, setRemoteVideo] = useState(false);

  const socket         = useRef<Socket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream    = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef  = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  // ✅ FIX: endCall stops ALL tracks immediately before anything else
  const endCall = useCallback((isInitiator = true) => {
    // 1. Stop every track — this is what kills the camera/mic browser indicator
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;

    // 2. Close the peer connection
    peerConnection.current?.close();
    peerConnection.current = null;

    // 3. Clear all media elements
    if (remoteAudioRef.current)  remoteAudioRef.current.srcObject  = null;
    if (localVideoRef.current)   localVideoRef.current.srcObject   = null;
    if (remoteVideoRef.current)  remoteVideoRef.current.srcObject  = null;

    // 4. Reset UI state
    setPhase("idle");
    setRemoteVideo(false);
    setMicOn(true);
    setCamOn(true);

    // 5. Notify remote only if we hung up (not if they did)
    if (isInitiator) socket.current?.emit("end-call", { to: remoteId });

    // 6. If remote ended the call, tell App to go back to lobby
    if (!isInitiator) onCallEnded?.();
  }, [remoteId, onCallEnded]);

  // ✅ FIX: expose endCall to App via registerEndCall prop
  useEffect(() => {
    registerEndCall?.(endCall);
  }, [registerEndCall, endCall]);

  const initPeer = useCallback(async () => {
    peerConnection.current = new RTCPeerConnection(rtcConfig);

    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current?.connectionState;
      if (state === "connected")                          setPhase("connected");
      if (state === "failed" || state === "disconnected") setPhase("idle");
    };

    localStream.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
    });

    if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current;

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, localStream.current!);
    });

    peerConnection.current.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
      const hasVideo = stream.getVideoTracks().length > 0;
      setRemoteVideo(hasVideo);
      if (remoteVideoRef.current && hasVideo) remoteVideoRef.current.srcObject = stream;
    };

    peerConnection.current.onicecandidate = (e) => {
      if (e.candidate) socket.current?.emit("ice-candidate", { to: remoteId, candidate: e.candidate });
    };
  }, [remoteId]);

  async function handleIncomingOffer({ offer, from }: SignalingMessage) {
    await initPeer();
    if (!offer) return;
    await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.current?.createAnswer();
    await peerConnection.current?.setLocalDescription(answer);
    socket.current?.emit("answer", { to: from, from: myId, answer });
    setPhase("calling");
  }

  async function handleIncomingAnswer({ answer }: SignalingMessage) {
    if (answer) await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
  }

  useEffect(() => {
    socket.current = io("http://localhost:3000");
    socket.current.emit("register", myId);
    socket.current.on("offer",         handleIncomingOffer);
    socket.current.on("answer",        handleIncomingAnswer);
    socket.current.on("end-call",      () => endCall(false));
    socket.current.on("ice-candidate", (candidate: RTCIceCandidateInit) => {
      peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // ✅ FIX: unmount cleanup also hard-stops all tracks
    return () => {
      socket.current?.disconnect();
      localStream.current?.getTracks().forEach((t) => t.stop());
      localStream.current = null;
      peerConnection.current?.close();
      peerConnection.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, remoteId]);

  const startCall = async () => {
    setPhase("calling");
    await initPeer();
    const offer = await peerConnection.current?.createOffer();
    await peerConnection.current?.setLocalDescription(offer);
    socket.current?.emit("offer", { to: remoteId, from: myId, offer });
  };

  const toggleMic = () => {
    const enabled = !micOn;
    localStream.current?.getAudioTracks().forEach((t) => (t.enabled = enabled));
    setMicOn(enabled);
  };

  const toggleCam = () => {
    const enabled = !camOn;
    localStream.current?.getVideoTracks().forEach((t) => (t.enabled = enabled));
    setCamOn(enabled);
  };

  const myInitials     = myId.slice(0, 2).toUpperCase();
  const remoteInitials = remoteId.slice(0, 2).toUpperCase();

  return (
    <div className="call-ui">
      <style>{styles}</style>
      <div className="call-stage">

        {remoteVideo ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
        ) : (
          <div className="remote-avatar">
            <div className="avatar-circle">{remoteInitials}</div>
            <span className="avatar-name">{remoteId}</span>
          </div>
        )}

        {phase !== "idle" && (
          <div className="status-badge">
            <span className={`status-dot ${phase === "connected" ? "" : "idle"}`} />
            {phase === "calling"   && <><span className="ringing">📞</span> Connecting<span className="dots"><span>.</span><span>.</span><span>.</span></span></>}
            {phase === "connected" && <><span>🟢</span> {remoteId} · Live</>}
          </div>
        )}

        {phase !== "idle" && (
          <div className="self-view">
            {camOn
              ? <video ref={localVideoRef} autoPlay playsInline muted className="self-video" />
              : <div className="self-avatar">{myInitials}</div>
            }
            <span className="self-label">{myId} (You)</span>
          </div>
        )}

        {phase === "idle" && (
          <div className="precall-overlay">
            <div className="avatar-circle" style={{ width: 80, height: 80, fontSize: 28 }}>{remoteInitials}</div>
            <p className="precall-text">Ready to call {remoteId}?</p>
            <p className="precall-sub">Your camera and mic will turn on when you join</p>
            <button className="btn-start-call" onClick={startCall}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
              Start call
            </button>
          </div>
        )}

        <div className={`control-bar ${phase !== "idle" ? "always-show" : ""}`}>
          <button className={`ctrl ${micOn ? "ctrl-default" : "ctrl-off"}`} onClick={toggleMic}>
            <span className="ctrl-tooltip">{micOn ? "Mute mic" : "Unmute mic"}</span>
            {micOn ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
              </svg>
            )}
          </button>

          <button className={`ctrl ${camOn ? "ctrl-default" : "ctrl-off"}`} onClick={toggleCam}>
            <span className="ctrl-tooltip">{camOn ? "Turn off camera" : "Turn on camera"}</span>
            {camOn ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 6.5l-4-4-15 15 4 4 2.5-2.5 2.41 2.41C11.6 21.14 12.28 21 13 21c2.97 0 5.46-2.01 6.16-4.73L21 18V6.5zm-8 11.5c-.35 0-.69-.04-1.02-.1L17 13.38V17c0 1.1-.9 2-2 2h-.5zM7.42 12.97L3.02 8.57C3 8.71 3 8.85 3 9v6c0 1.1.9 2 2 2h8c.23 0 .46-.04.67-.1L7.42 12.97z"/>
              </svg>
            )}
          </button>

          {phase !== "idle" && (
            <button className="ctrl ctrl-end" onClick={() => endCall(true)}>
              <span className="ctrl-tooltip">Leave call</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.01l-2.21 2.21z"/>
              </svg>
            </button>
          )}
        </div>

        <audio ref={remoteAudioRef} autoPlay />
      </div>
    </div>
  );
};

export default AudioCall;