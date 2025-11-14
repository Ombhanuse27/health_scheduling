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
    const peerConfig = {
      host: isLocal ? "localhost" : "health-scheduling.onrender.com",
      port: isLocal ? 5000 : 443,
      path: "/peerjs",
      secure: !isLocal,
      config: {
        iceServers: [
          // ✅ Public Google STUN servers
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          // ✅ Free TURN server (fallback relay)
          {
            urls: "turn:relay1.expressturn.com:3478",
            username: "efree",
            credential: "efree",
          },
        ],
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Show own video
      if (myVideo.current) {
        myVideo.current.srcObject = stream;
        await myVideo.current.play().catch(() => {});
      }

      // 🔹 Common function to handle an incoming call
      const handleIncomingCall = (call) => {
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
        call.on("close", () => console.log("❌ Call closed"));
        call.on("error", (err) => console.error("⚠️ Call error:", err));
      };

      // 🔹 Common function to handle an outgoing call's stream
      const handleOutgoingCall = (call) => {
        callRef.current = call;
        call.on("stream", async (remoteStream) => {
          console.log("👀 Connected to remote stream!");
          if (remoteVideo.current) {
            remoteVideo.current.srcObject = remoteStream;
            await remoteVideo.current.play().catch(() => {});
          }
        });
        call.on("close", () => console.log("❌ Remote call closed"));
        call.on("error", (err) => console.error("⚠️ Remote call error:", err));
      };

      // 🔹 Attempt to connect as the "Host" (using the roomId from URL as the Peer ID)
      const hostPeer = new Peer(roomId, peerConfig);
      peerRef.current = hostPeer;

      hostPeer.on("open", (id) => {
        console.log(`✅ Connected as HOST with ID: ${id}`);
        setPeerId(id);
        // As the host, we just wait for calls
        hostPeer.on("call", handleIncomingCall);
      });

      hostPeer.on("error", (err) => {
        if (err.type === "unavailable-id") {
          // 🔹 ID is taken, which means the Host is already here.
          // 🔹 We must connect as a "Joiner" instead.
          console.log("Host already present. Connecting as JOINER.");
          hostPeer.destroy(); // Clean up the failed peer attempt

          const joinerPeer = new Peer(peerConfig); // Connect with a random ID
          peerRef.current = joinerPeer;

          joinerPeer.on("open", (id) => {
            console.log(`✅ Connected as JOINER with ID: ${id}`);
            setPeerId(id);

            // Call the host (who is waiting at the roomId)
            console.log(`📡 Calling host at: ${roomId}`);
            const call = joinerPeer.call(roomId, stream);
            handleOutgoingCall(call);
          });

          // A joiner might also receive a call if both join at the exact same time
          joinerPeer.on("call", handleIncomingCall);
          joinerPeer.on("error", (err) =>
            console.error("🚨 Joiner Peer error:", err)
          );
        } else {
          // Other unexpected error
          console.error("🚨 Host Peer error:", err);
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

  useEffect(() => {
    return () => endCall();
  }, []);

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
