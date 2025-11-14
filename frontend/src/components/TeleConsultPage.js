import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Peer from "peerjs";

const TeleConsultPage = () => {
  const { roomId } = useParams();
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const dataConnectionRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const [isStarted, setIsStarted] = useState(false);
  const [peerId, setPeerId] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // 🔹 State for the *other* user
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [isRemoteCameraOff, setIsRemoteCameraOff] = useState(false);

  // 🔹 Store peer config
  const peerConfig = {
    host:
      window.location.hostname === "localhost"
        ? "localhost"
        : "health-scheduling.onrender.com",
    port: window.location.hostname === "localhost" ? 5000 : 443,
    path: "/peerjs",
    secure: !(window.location.hostname === "localhost"),
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    },
  };

  const startTeleConsult = async () => {
    setIsStarted(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      cameraStreamRef.current = stream; // 🔹 Store camera stream

      // Show own video
      if (myVideo.current) {
        myVideo.current.srcObject = stream;
        await myVideo.current.play().catch(() => {});
      }

      // 🔹 Common function to handle an incoming call
      const handleIncomingCall = (call) => {
        console.log("📞 Incoming call...");
        call.answer(cameraStreamRef.current); // Answer with camera stream
        callRef.current = call;

        call.on("stream", async (remoteStream) => {
          console.log("👀 Receiving remote stream...");
          if (remoteVideo.current) {
            remoteVideo.current.srcObject = remoteStream;
            await remoteVideo.current.play().catch(() => {});
          }
        });
        call.on("close", () => {
          console.log("❌ Call closed");
          if (remoteVideo.current) remoteVideo.current.srcObject = null;
        });
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
        call.on("close", () => {
          console.log("❌ Remote call closed");
          if (remoteVideo.current) remoteVideo.current.srcObject = null;
        });
        call.on("error", (err) => console.error("⚠️ Remote call error:", err));
      };

      // 🔹 Setup Data Connection (for chat and status)
      const setupDataConnection = (conn) => {
        dataConnectionRef.current = conn;
        conn.on("open", () => {
          console.log("💬 Data connection open");
          // Send current status on connect
          conn.send({
            type: "status",
            isMuted,
            isCameraOff,
          });
        });
        conn.on("data", (data) => {
          if (data.type === "chat") {
            setMessages((prev) => [
              ...prev,
              { sender: "remote", text: data.text },
            ]);
          } else if (data.type === "status") {
            setIsRemoteMuted(data.isMuted);
            setIsRemoteCameraOff(data.isCameraOff);
          }
        });
      };

      // 🔹 Attempt to connect as the "Host"
      const hostPeer = new Peer(roomId, peerConfig);
      peerRef.current = hostPeer;

      hostPeer.on("open", (id) => {
        console.log(`✅ Connected as HOST with ID: ${id}`);
        setPeerId(id);
        hostPeer.on("call", handleIncomingCall);
        hostPeer.on("connection", setupDataConnection); // Wait for data connection
      });

      hostPeer.on("error", (err) => {
        if (err.type === "unavailable-id") {
          // 🔹 ID is taken, connect as "Joiner"
          console.log("Host already present. Connecting as JOINER.");
          hostPeer.destroy();

          const joinerPeer = new Peer(peerConfig); // Connect with a random ID
          peerRef.current = joinerPeer;

          joinerPeer.on("open", (id) => {
            console.log(`✅ Connected as JOINER with ID: ${id}`);
            setPeerId(id);

            // Call the host
            console.log(`📡 Calling host at: ${roomId}`);
            const call = joinerPeer.call(roomId, cameraStreamRef.current);
            handleOutgoingCall(call);

            // 🔹 Initiate data connection
            const conn = joinerPeer.connect(roomId);
            setupDataConnection(conn);
          });
          joinerPeer.on("error", (err) =>
            console.error("🚨 Joiner Peer error:", err)
          );
        } else {
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
    if (dataConnectionRef.current) dataConnectionRef.current.close();
    if (peerRef.current) peerRef.current.destroy();

    [cameraStreamRef, screenStreamRef].forEach((streamRef) => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    });
    [myVideo, remoteVideo].forEach((video) => {
      if (video.current?.srcObject) video.current.srcObject = null;
    });

    setIsStarted(false);
    peerRef.current = null;
    callRef.current = null;
    dataConnectionRef.current = null;
  };

  useEffect(() => {
    // 🔹 Cleanup on component unmount
    return () => endCall();
  }, []);

  // 🔹 Send data message
  const sendData = (data) => {
    dataConnectionRef.current?.send(data);
  };

  // 🔹 Toggle Mute
  const toggleAudio = () => {
    const newState = !isMuted;
    cameraStreamRef.current
      .getAudioTracks()
      .forEach((track) => (track.enabled = !newState));
    setIsMuted(newState);
    sendData({ type: "status", isMuted: newState, isCameraOff });
  };

  // 🔹 Toggle Camera
  const toggleVideo = () => {
    if (isScreenSharing) return; // Can't toggle camera while screen sharing
    const newState = !isCameraOff;
    cameraStreamRef.current
      .getVideoTracks()
      .forEach((track) => (track.enabled = !newState));
    setIsCameraOff(newState);
    sendData({ type: "status", isMuted, isCameraOff: newState });
  };

  // 🔹 Replace the video track in the call
  const replaceVideoTrack = (newTrack) => {
    const sender = callRef.current?.peerConnection
      .getSenders()
      .find((s) => s.track.kind === "video");
    if (sender && newTrack) {
      sender.replaceTrack(newTrack);
    }
  };

  // 🔹 Stop Screen Share (helper)
  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    const cameraTrack = cameraStreamRef.current.getVideoTracks()[0];
    cameraTrack.enabled = !isCameraOff; // Restore camera state
    replaceVideoTrack(cameraTrack);
    setIsScreenSharing(false);
  };

  // 🔹 Toggle Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // We are SHARING -> STOP sharing
      stopScreenShare();
    } else {
      // We are NOT sharing -> START sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true, // Allow sharing audio (e.g., from a video)
        });
        screenStreamRef.current = stream;
        const screenTrack = stream.getVideoTracks()[0];

        // Disable camera light
        cameraStreamRef.current
          .getVideoTracks()
          .forEach((track) => (track.enabled = false));

        replaceVideoTrack(screenTrack);
        setIsScreenSharing(true);

        // Listen for when user clicks "Stop sharing" in browser
        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.error("Failed to start screen share:", err);
      }
    }
  };

  // 🔹 Send Chat Message
  const sendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim() === "") return;
    const message = {
      type: "chat",
      text: chatInput,
    };
    sendData(message);
    setMessages((prev) => [...prev, { sender: "me", text: chatInput }]);
    setChatInput("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* 1. Header */}
      <header className="h-16 flex items-center justify-center bg-gray-800 shadow-lg z-20">
        <h1 className="text-xl md:text-2xl font-bold">
          🩺 Teleconsultation Room
        </h1>
      </header>

      {/* 2. Start Overlay */}
      {!isStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 z-50">
          <button
            onClick={startTeleConsult}
            className="px-8 py-4 bg-green-500 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-green-600 transition"
          >
            ▶️ Start Teleconsultation
          </button>
          <p className="text-white mt-4 text-sm opacity-80">
            Click to enable camera and microphone
          </p>
        </div>
      )}

      {/* 3. Main Content (Videos + Chat) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 3a. Video Area */}
        <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 items-center justify-center">
          {/* Remote Video */}
          <div className="relative w-full md:w-1/2 h-full max-h-[80vh] bg-black rounded-lg overflow-hidden shadow-2xl">
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <p className="absolute top-2 left-4 text-lg font-semibold">
              Doctor/Patient
            </p>
            {/* Remote Status Indicators */}
            <div className="absolute top-2 right-4 flex gap-2">
              {isRemoteMuted && (
                <span
                  className="p-2 bg-red-500 rounded-full"
                  title="Muted"
                >
                  🔇
                </span>
              )}
              {isRemoteCameraOff && (
                <span
                  className="p-2 bg-gray-600 rounded-full"
                  title="Camera Off"
                >
                  📸
                </span>
              )}
            </div>
            {isRemoteCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl opacity-50">📸</span>
              </div>
            )}
          </div>

          {/* Local Video */}
          <div className="relative w-full md:w-1/2 h-full max-h-[80vh] bg-black rounded-lg overflow-hidden shadow-2xl">
            <video
              ref={myVideo}
              muted
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <p className="absolute top-2 left-4 text-lg font-semibold">You</p>
            {isCameraOff && !isScreenSharing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl opacity-50">📸</span>
              </div>
            )}
            {isScreenSharing && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <p className="text-xl">💻 You are screen sharing</p>
              </div>
            )}
          </div>
        </main>

        {/* 3b. Chat Panel */}
        <div
          className={`absolute top-0 right-0 w-80 h-full bg-gray-800 z-30
                      transform transition-transform ${
                        isChatOpen ? "translate-x-0" : "translate-x-full"
                      }
                      flex flex-col shadow-lg`}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h3 className="font-semibold text-lg">Chat</h3>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded-full hover:bg-gray-700"
            >
              ✖️
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === "me" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    msg.sender === "me"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-600 text-white"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-700 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 text-white"
            />
            <button type="submit" className="px-4 py-2 bg-blue-600 rounded">
              Send
            </button>
          </form>
        </div>
      </div>

      {/* 4. Control Bar */}
      <footer className="h-20 flex items-center justify-center gap-4 bg-gray-800 shadow-inner z-20">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${
            isMuted ? "bg-red-500" : "bg-gray-600 hover:bg-gray-500"
          } transition`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🎤" : "🎤"}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            isCameraOff ? "bg-red-500" : "bg-gray-600 hover:bg-gray-500"
          } transition ${isScreenSharing ? "opacity-50 cursor-not-allowed" : ""}`}
          title={isCameraOff ? "Start Video" : "Stop Video"}
          disabled={isScreenSharing}
        >
          {isCameraOff ? "📹" : "📹"}
        </button>
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full ${
            isScreenSharing ? "bg-blue-500" : "bg-gray-600 hover:bg-gray-500"
          } transition`}
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        >
          💻
        </button>
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="p-3 rounded-full bg-gray-600 hover:bg-gray-500 transition"
          title="Chat"
        >
          💬
        </button>
        <button
          onClick={endCall}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
        >
          🔴 End Call
        </button>
      </footer>
    </div>
  );
};

export default TeleConsultPage;