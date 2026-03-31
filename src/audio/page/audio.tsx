import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { SignalingMessage } from "../types/audio";

interface Props {
  myId: string;
  remoteId: string;
}

const AudioCall: React.FC<Props> = ({ myId, remoteId }) => {
  const [isConnected, setIsConnected] = useState(false);

  // Refs for persistent objects across re-renders
  const socket = useRef<Socket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };
  const initPeer = async () => {
    peerConnection.current = new RTCPeerConnection(rtcConfig);

    peerConnection.current.onconnectionstatechange = () => {
      console.log("Connection State:", peerConnection.current?.connectionState);
      if (peerConnection.current?.connectionState === "connected") {
        setIsConnected(true); // Switches button to "In Call"
      }
      if (
        peerConnection.current?.connectionState === "failed" ||
        peerConnection.current?.connectionState === "disconnected"
      ) {
        setIsConnected(false);
      }
    };

    // Get Microphone
    localStream.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    localStream.current.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, localStream.current!);
    });

    // Handle incoming remote audio
    peerConnection.current.ontrack = (event) => {
      console.log("Remote track received!");
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    // Send ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current?.emit("ice-candidate", {
          to: remoteId,
          candidate: event.candidate,
        });
      }
    };
  };

  const endCall = (isInitiator: boolean = true) => {
    // 1. Stop the microphone
    localStream.current?.getTracks().forEach((track) => track.stop());
    localStream.current = null;

    // 2. Close the Peer Connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // 3. Clear the audio element
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    // 4. Reset UI state
    setIsConnected(false);

    // 5. Notify the other person if we are the one who clicked "End"
    if (isInitiator) {
      socket.current?.emit("end-call", { to: remoteId });
    }
  };

  async function handleIncomingOffer({ offer, from }: SignalingMessage) {
    await initPeer();
    if (offer) {
      await peerConnection.current?.setRemoteDescription(
        new RTCSessionDescription(offer),
      );
      const answer = await peerConnection.current?.createAnswer();
      await peerConnection.current?.setLocalDescription(answer);
      socket.current?.emit("answer", { to: from, from: myId, answer });
    }
  }

  async function handleIncomingAnswer({ answer }: SignalingMessage) {
    if (answer) {
      await peerConnection.current?.setRemoteDescription(
        new RTCSessionDescription(answer),
      );
    }
  }

  useEffect(() => {
    // 1. Initialize Socket
    socket.current = io("http://localhost:3000");
    socket.current.emit("register", myId);

    // 2. Setup Listeners
    socket.current.on("offer", handleIncomingOffer);
    socket.current.on("answer", handleIncomingAnswer);

    socket.current.on("end-call", () => {
      console.log("Other person ended the call");
      endCall(false); // Pass false so we don't loop the signal back
    });

    socket.current.on("ice-candidate", (candidate: RTCIceCandidateInit) => {
      peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      socket.current?.disconnect();
      localStream.current?.getTracks().forEach((track) => track.stop());
      endCall(false); 
    };
  }, [myId, remoteId]);

  const startCall = async () => {
    await initPeer();
    const offer = await peerConnection.current?.createOffer();
    await peerConnection.current?.setLocalDescription(offer);

    socket.current?.emit("offer", { to: remoteId, from: myId, offer });
  };

  return (
  <div className="p-4 border rounded shadow-md">
    <h3 className="font-bold">Audio Session: {myId}</h3>
    <div className="mt-4 flex gap-2">
      {!isConnected ? (
        <button
          onClick={startCall}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          Call {remoteId}
        </button>
      ) : (
        <button
          onClick={() => endCall(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
        >
          End Call
        </button>
      )}
    </div>

    {/* The status indicator */}
    <p className="mt-2 text-sm text-gray-500">
      Status: {isConnected ? "Connected" : "Idle"}
    </p>

    <audio ref={remoteAudioRef} autoPlay />
  </div>
);

};

export default AudioCall;
