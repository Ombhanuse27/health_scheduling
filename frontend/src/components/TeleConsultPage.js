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
  const [isInCall, setIsInCall] = useState(false);

  // 🚀 Start teleconsultation
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
        await myVideo.current.play().catch(() => {});
      }

      // Listen for incoming call
      peer.on("call", (call) => {
        console.log("📞 Incoming call...");
        call.answer(stream);
        setIsInCall(true);

        call.on("stream", async (remoteStream) => {
          if (remoteVideo.current) {
            remoteVideo.current.srcObject = remoteStream;
            await remoteVideo.current.play().catch(() => {});
          }
        });

        callRef.current = call;
      });

      // When peer connects
      peer.on("open", (id) => {
        console.log("✅ Peer connected with ID:", id);

        // Try connecting to existing peer (room)
        if (roomId && roomId !== id) {
          console.log("📡 Connecting to room:", roomId);
          const call = peer.call(roomId, stream);
          setIsInCall(true);

          call.on("stream", async (remoteStream) => {
            if (remoteVideo.current) {
              remoteVideo.current.srcObject = remoteStream;
              await remoteVideo.current.play().catch(() => {});
            }
          });
          callRef.current = call;
        }
      });
    } catch (err) {
      console.error("❌ Camera/Mic access error:", err);
      alert("Please allow camera and microphone permissions to continue.");
      setIsStarted(false);
    }
  };

  // 🔴 End call and cleanup
  const endCall = () => {
    console.log("📴 Ending call...");
    if (callRef.current) callRef.current.close();
    if (peerRef.current) peerRef.current.destroy();

    if (myVideo.current?.srcObject) {
      myVideo.current.srcObject.getTracks().forEach((t) => t.stop());
      myVideo.current.srcObject = null;
    }
    if (remoteVideo.current?.srcObject) {
      remoteVideo.current.srcObject.getTracks().forEach((t) => t.stop());
      remoteVideo.current.srcObject = null;
    }

    setIsInCall(false);
    setIsStarted(false);
    peerRef.current = null;
    callRef.current = null;
  };

  // 🧹 Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 relative">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        🩺 Teleconsultation Room
      </h1>

      {/* Overlay before start */}
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

      {/* End Call button */}
      {isInCall && (
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
