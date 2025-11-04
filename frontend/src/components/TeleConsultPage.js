import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Peer from "peerjs";

const TeleConsultPage = () => {
  const { roomId } = useParams();
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const [isStarted, setIsStarted] = useState(false);
  const [peerId, setPeerId] = useState("");

  const startTeleConsult = async () => {
    setIsStarted(true);

    const isLocal = window.location.hostname === "localhost";
    const peer = new Peer({
      host: isLocal ? "localhost" : "health-scheduling.onrender.com",
      port: isLocal ? 5000 : 443,
      path: "/peerjs",
      secure: !isLocal,
    });

    peerRef.current = peer;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (myVideo.current) {
        myVideo.current.srcObject = stream;
        myVideo.current.play().catch(() => {});
      }

      // 🔹 Handle incoming calls
      peer.on("call", (call) => {
        console.log("📞 Incoming call...");
        call.answer(stream);
        callRef.current = call;

        call.on("stream", async (remoteStream) => {
          console.log("👀 Receiving remote stream...");
          if (remoteVideo.current) {
            remoteVideo.current.srcObject = remoteStream;
            await remoteVideo.current.play().catch(() => {});
          }
        });
      });

      // 🔹 Peer ready
      peer.on("open", async (id) => {
        console.log("✅ Peer connected with ID:", id);
        setPeerId(id);

        // If visiting a room link, connect to that peer
        if (roomId && roomId !== id) {
          console.log("📡 Connecting to room:", roomId);
          const call = peer.call(roomId, stream);
          callRef.current = call;

          call.on("stream", async (remoteStream) => {
            console.log("👀 Connected to remote stream!");
            if (remoteVideo.current) {
              remoteVideo.current.srcObject = remoteStream;
              await remoteVideo.current.play().catch(() => {});
            }
          });
        } else {
          // First user creates the room link
          console.log(`🔗 Share this link: ${window.location.origin}/teleconsult/${id}`);
        }
      });
    } catch (err) {
      console.error("❌ Camera/Mic access error:", err);
      alert("Please allow camera and microphone permissions to continue.");
      setIsStarted(false);
    }
  };

  const endCall = () => {
    console.log("📴 Ending call...");
    if (callRef.current) callRef.current.close();
    if (peerRef.current) peerRef.current.destroy();

    [myVideo, remoteVideo].forEach((video) => {
      if (video.current?.srcObject) {
        video.current.srcObject.getTracks().forEach((t) => t.stop());
        video.current.srcObject = null;
      }
    });

    setIsStarted(false);
    peerRef.current = null;
    callRef.current = null;
  };

  useEffect(() => () => endCall(), []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 relative">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        🩺 Teleconsultation Room
      </h1>

      {!isStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80 z-20">
          <button
            onClick={startTeleConsult}
            className="px-6 py-3 bg-green-500 text-white font-semibold rounded-xl shadow-lg hover:bg-green-600 transition"
          >
            ▶️ Start Teleconsultation
          </button>
          <p className="text-white mt-2 text-sm opacity-80">
            Click to enable camera and microphone
          </p>
          {peerId && (
            <p className="text-green-400 mt-4 break-all text-xs">
              🔗 Share this link: {window.location.origin}/teleconsult/{peerId}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 z-10">
        <div className="text-center">
          <p className="font-semibold mb-2">You</p>
          <video
            ref={myVideo}
            muted
            autoPlay
            playsInline
            className="w-72 h-56 border rounded-lg bg-black"
          />
        </div>
        <div className="text-center">
          <p className="font-semibold mb-2">Doctor/Patient</p>
          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            className="w-72 h-56 border rounded-lg bg-black"
          />
        </div>
      </div>

      {isStarted && (
        <button
          onClick={endCall}
          className="absolute bottom-8 px-6 py-3 bg-red-500 text-white font-semibold rounded-xl shadow-md hover:bg-red-600 transition"
        >
          🔴 End Call
        </button>
      )}
    </div>
  );
};

export default TeleConsultPage;
