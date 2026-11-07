
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import {
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  X,
} from "lucide-react";

type VideoCallProps = {
  socket: Socket | null;
  conversationId: string;
  currentUserId: string;
  recipientId: string;
  recipientName: string;
};

type CallEvent = {
  conversationId?: string;
  callerId?: string;
  callerName?: string;
  acceptedBy?: string;
  recipientId?: string;
  targetUserId?: string;
  signal?: RTCSessionDescriptionInit | RTCIceCandidateInit;
};

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

export default function VideoCall({
  socket,
  conversationId,
  currentUserId,
  recipientId,
  recipientName,
}: VideoCallProps) {
  const [status, setStatus] = useState("Ready to call");
  const [incoming, setIncoming] = useState<CallEvent | null>(null);
  const [active, setActive] = useState(false);
  const [callVisible, setCallVisible] = useState(false);
  const [localMediaReady, setLocalMediaReady] = useState(false);
  const [remoteMediaReady, setRemoteMediaReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const callWindow = useRef<HTMLElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteUserIdRef = useRef("");
  const incomingRef = useRef<CallEvent | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const callAttemptRef = useRef(0);

  const stopMedia = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalMediaReady(false);
    setRemoteMediaReady(false);

    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;

    pendingCandidates.current = [];
    setActive(false);
    setMuted(false);
    setCameraOff(false);
  }, []);

  useEffect(() => {
    if (localVideo.current) {
      localVideo.current.srcObject = localStreamRef.current;
      if (localStreamRef.current) {
        void localVideo.current.play().catch(() => {});
      }
    }

    if (remoteVideo.current) {
      remoteVideo.current.srcObject = remoteStreamRef.current;
      if (remoteStreamRef.current) {
        void remoteVideo.current.play().catch(() => {});
      }
    }
  }, [callVisible, active, incoming, localMediaReady, remoteMediaReady]);

  const endCall = useCallback(
    (notify = true) => {
      callAttemptRef.current += 1;
      if (notify && socket && remoteUserIdRef.current) {
        socket.emit("call:end", {
          conversationId,
          targetUserId: remoteUserIdRef.current,
        });
      }

      stopMedia();
      setIncoming(null);
      incomingRef.current = null;
      remoteUserIdRef.current = "";
      setRemoteMediaReady(false);
      setCallVisible(false);
      setStatus("Call ended");
    },
    [socket, conversationId, stopMedia]
  );

  const getLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera and microphone require HTTPS or localhost.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStreamRef.current = stream;
    setLocalMediaReady(true);

    if (localVideo.current) {
      localVideo.current.srcObject = stream;
      void localVideo.current.play().catch(() => {});
    }

    return stream;
  }, []);

  const createPeer = useCallback(async () => {
    if (peerRef.current) return peerRef.current;

    const stream = await getLocalMedia();
    const peer = new RTCPeerConnection(ICE_SERVERS);

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (event) => {
      const remoteStream = event.streams[0] ?? new MediaStream([event.track]);
      remoteStreamRef.current = remoteStream;
      setRemoteMediaReady(true);

      if (remoteVideo.current && remoteStream) {
        remoteVideo.current.srcObject = remoteStream;
        void remoteVideo.current.play().catch(() => {});
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && socket && remoteUserIdRef.current) {
        socket.emit("call:ice-candidate", {
          conversationId,
          targetUserId: remoteUserIdRef.current,
          signal: event.candidate.toJSON(),
        });
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") {
        setStatus("Connected");
      } else if (peer.connectionState === "connecting") {
        setStatus("Connecting video...");
      } else if (
        peer.connectionState === "failed" ||
        peer.connectionState === "disconnected"
      ) {
        setStatus("Connection interrupted");
      }
    };

    peerRef.current = peer;
    return peer;
  }, [conversationId, getLocalMedia, socket]);

  const flushCandidates = useCallback(async (peer: RTCPeerConnection) => {
    const queued = [...pendingCandidates.current];
    pendingCandidates.current = [];

    for (const candidate of queued) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Could not add queued ICE candidate:", error);
      }
    }
  }, []);

  const startCall = async () => {
    if (!socket || !socket.connected || !conversationId || !recipientId) {
      setStatus("Chat connection is not ready");
      return;
    }

    const attempt = ++callAttemptRef.current;
    try {
      remoteUserIdRef.current = recipientId;
      setCallVisible(true);
      setStatus("Requesting camera and microphone...");
      await getLocalMedia();
      if (attempt !== callAttemptRef.current) {
        stopMedia();
        return;
      }

      socket.emit(
        "call:invite",
        { conversationId, recipientId },
        (response: { success?: boolean; message?: string }) => {
          if (attempt === callAttemptRef.current && !response?.success) {
            setStatus(response?.message || "Could not start the call.");
            stopMedia();
            setIncoming(null);
            incomingRef.current = null;
            remoteUserIdRef.current = "";
          }
        }
      );

      setStatus(`Calling ${recipientName}...`);
    } catch (error) {
      if (attempt !== callAttemptRef.current) {
        stopMedia();
        return;
      }
      setStatus(
        error instanceof Error ? error.message : "Could not start the call"
      );
      stopMedia();
    }
  };

  const acceptCall = async () => {
    if (!socket || !incomingRef.current) return;

    const attempt = ++callAttemptRef.current;
    try {
      const call = incomingRef.current;
      const callerId = call.callerId;

      if (!callerId) {
        setStatus("The incoming call has invalid caller details");
        return;
      }

      remoteUserIdRef.current = callerId;
      setCallVisible(true);
      setStatus("Preparing your camera...");
      await getLocalMedia();
      if (attempt !== callAttemptRef.current) {
        stopMedia();
        return;
      }

      socket.emit(
        "call:accept",
        { conversationId, callerId },
        (response: { success?: boolean; message?: string }) => {
          if (!response?.success) {
            setStatus(response?.message || "Could not accept the call.");
            endCall(false);
          }
        }
      );

      setIncoming(null);
      incomingRef.current = null;
      setActive(true);
      setStatus("Call accepted. Connecting...");
    } catch (error) {
      if (attempt !== callAttemptRef.current) {
        stopMedia();
        return;
      }
      setStatus(
        error instanceof Error ? error.message : "Could not accept the call"
      );
      endCall(false);
    }
  };

  const rejectCall = () => {
    callAttemptRef.current += 1;
    const call = incomingRef.current;
    if (socket && call) {
      socket.emit("call:reject", {
        conversationId,
        callerId: call.callerId,
      });
    }

    setIncoming(null);
    incomingRef.current = null;
    setCallVisible(false);
    setStatus("Call declined");
  };

  useEffect(() => {
    if (!socket) return;

    const onIncoming = (event: CallEvent) => {
      if (event.conversationId !== conversationId) return;
      if (event.recipientId && event.recipientId !== currentUserId) return;

      // Ignore invitations from the current user.
      if (event.callerId === currentUserId) return;

      incomingRef.current = event;
      setIncoming(event);
      setCallVisible(true);
      setStatus(`${event.callerName || "Someone"} is calling...`);
    };

    const onAccepted = async (event: CallEvent) => {
      if (event.conversationId !== conversationId) return;
      if (event.callerId !== currentUserId) return;

      try {
        setActive(true);
        setStatus("Creating video connection...");

        const peer = await createPeer();
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit("call:offer", {
          conversationId,
          targetUserId: remoteUserIdRef.current,
          signal: offer,
        });
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "Could not create call"
        );
        endCall();
      }
    };

    const onOffer = async (event: CallEvent) => {
      if (event.conversationId !== conversationId || !event.signal) return;

      try {
        const peer = await createPeer();
        await peer.setRemoteDescription(
          new RTCSessionDescription(
            event.signal as RTCSessionDescriptionInit
          )
        );

        await flushCandidates(peer);

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit("call:answer", {
          conversationId,
          targetUserId: remoteUserIdRef.current,
          signal: answer,
        });

        setActive(true);
        setStatus("Connecting video...");
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "Could not answer call"
        );
        endCall();
      }
    };

    const onAnswer = async (event: CallEvent) => {
      if (
        event.conversationId !== conversationId ||
        !event.signal ||
        !peerRef.current
      ) return;

      try {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(
            event.signal as RTCSessionDescriptionInit
          )
        );

        await flushCandidates(peerRef.current);
      } catch (error) {
        console.error("Could not process call answer:", error);
      }
    };

    const onIceCandidate = async (event: CallEvent) => {
      if (event.conversationId !== conversationId || !event.signal) return;

      const candidate = event.signal as RTCIceCandidateInit;

      if (!peerRef.current?.remoteDescription) {
        pendingCandidates.current.push(candidate);
        return;
      }

      try {
        await peerRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error("Could not add ICE candidate:", error);
      }
    };

    const onRejected = (event: CallEvent) => {
      if (event.conversationId !== conversationId) return;
      stopMedia();
      remoteUserIdRef.current = "";
      setCallVisible(false);
      setStatus("Call declined");
    };

    const onEnded = (event: CallEvent) => {
      if (event.conversationId !== conversationId) return;
      stopMedia();
      setIncoming(null);
      incomingRef.current = null;
      remoteUserIdRef.current = "";
      setCallVisible(false);
      setStatus("Call ended by the other user");
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:rejected", onRejected);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:rejected", onRejected);
      socket.off("call:ended", onEnded);
      callAttemptRef.current += 1;
      stopMedia();
    };
  }, [
    socket,
    conversationId,
    currentUserId,
    createPeer,
    flushCandidates,
    stopMedia,
    endCall,
  ]);

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setCameraOff(!track.enabled);
  };

  const closeCall = () => {
    if (incomingRef.current) {
      rejectCall();
      return;
    }
    endCall();
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await callWindow.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not change fullscreen."
      );
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => void startCall()}
        disabled={
          !socket?.connected || active || Boolean(incoming) || callVisible
        }
        title="Start a video call"
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:text-sm"
      >
        <Video size={16} />
        <span>Video call</span>
      </button>

      {callVisible && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 p-1.5 backdrop-blur-md sm:p-3">
          <section
            ref={callWindow}
            className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#090d18] text-white shadow-2xl sm:rounded-[28px]"
            aria-label="Video call"
          >
            <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-slate-950/70 px-4 py-3 sm:px-7 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
                  <Video size={19} />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold sm:text-base">
                    SkillConnect call
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {status}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white sm:flex"
                >
                  {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button
                  type="button"
                  onClick={closeCall}
                  aria-label={incoming ? "Decline call" : "End call"}
                  title={incoming ? "Decline call" : "End call"}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-red-500/20 hover:text-red-300"
                >
                  <X size={19} />
                </button>
              </div>
            </header>

            {incoming && !active ? (
              <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-10 text-center">
                <div className="pointer-events-none absolute h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-300/20">
                  <Phone size={34} className="animate-pulse" />
                </div>
                <p className="relative mt-7 text-xs font-bold uppercase tracking-[0.24em] text-indigo-300">
                  Incoming video call
                </p>
                <h3 className="relative mt-3 text-2xl font-bold sm:text-4xl">
                  {incoming.callerName || "SkillConnect member"}
                </h3>
                <p className="relative mt-3 max-w-md text-sm leading-6 text-slate-400">
                  Accept to join the conversation with your camera and
                  microphone.
                </p>
                <div className="relative mt-9 flex w-full max-w-sm gap-3">
                  <button
                    type="button"
                    onClick={rejectCall}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    <PhoneOff size={18} />
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => void acceptCall()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-400"
                  >
                    <Phone size={18} />
                    Accept
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-[#111827] to-[#090d18] p-2 sm:p-5">
                  <div className="relative h-full min-h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl sm:rounded-3xl">
                    <video
                      ref={remoteVideo}
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                    />
                    {!remoteMediaReady && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 px-5 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-2xl font-bold text-white ring-1 ring-white/10">
                          {recipientName.trim().slice(0, 1).toUpperCase() || "?"}
                        </div>
                        <p className="mt-4 text-base font-semibold">
                          {recipientName}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {active ? "Connecting video..." : status}
                        </p>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md sm:bottom-5 sm:left-5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      {recipientName}
                    </div>
                  </div>

                  <div className="absolute right-4 top-4 aspect-video w-[min(34vw,230px)] overflow-hidden rounded-2xl border border-white/20 bg-slate-800 shadow-xl sm:right-9 sm:top-9 sm:w-[min(25vw,300px)]">
                    <video
                      ref={localVideo}
                      autoPlay
                      muted
                      playsInline
                      className={`h-full w-full object-cover ${
                        cameraOff ? "opacity-0" : ""
                      }`}
                    />
                    {cameraOff && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-300">
                        <VideoOff size={24} />
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
                      You
                    </span>
                  </div>
                </div>

                <footer className="flex shrink-0 flex-col items-center gap-3 border-t border-white/10 bg-slate-950/80 px-4 py-4 sm:px-7 sm:py-5">
                  <p className="text-xs font-medium text-slate-400">
                    {status}
                  </p>
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={toggleMic}
                      disabled={!localMediaReady}
                      aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                      title={muted ? "Unmute microphone" : "Mute microphone"}
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl transition sm:h-14 sm:w-14 ${
                        muted
                          ? "bg-white text-slate-900"
                          : "border border-white/10 bg-white/10 text-white hover:bg-white/15"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {muted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <button
                      type="button"
                      onClick={toggleCamera}
                      disabled={!localMediaReady}
                      aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}
                      title={cameraOff ? "Turn camera on" : "Turn camera off"}
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl transition sm:h-14 sm:w-14 ${
                        cameraOff
                          ? "bg-white text-slate-900"
                          : "border border-white/10 bg-white/10 text-white hover:bg-white/15"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => endCall()}
                      aria-label="End call"
                      title="End call"
                      className="flex h-12 min-w-16 items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 text-white shadow-lg shadow-red-950/30 transition hover:bg-red-400 sm:h-14 sm:min-w-20"
                    >
                      <PhoneOff size={20} />
                      <span className="text-xs font-bold sm:text-sm">End</span>
                    </button>
                  </div>
                </footer>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
