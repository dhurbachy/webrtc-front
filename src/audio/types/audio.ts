// types.ts
export interface SignalingMessage {
  to: string;
  from: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}
