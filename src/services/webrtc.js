// WebRTC Mesh Manager for AniWatch Party
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export class WebRTCManager {
  constructor({ socket, onRemoteStream, onPeerLeft, onSpeakingChange }) {
    this.socket = socket;
    this.onRemoteStream = onRemoteStream;
    this.onPeerLeft = onPeerLeft;
    this.onSpeakingChange = onSpeakingChange;

    this.localStream = null;
    this.peerConnections = new Map(); // socketId -> RTCPeerConnection
    this.audioContext = null;
    this.analysers = new Map(); // socketId -> AnalyserNode
    this.speakingInterval = null;
  }

  // 1. Initialize local camera & microphone
  async startLocalMedia({ video = true, audio = true }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24 }
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        } : false
      });

      this.initVoiceActivityDetection('local', this.localStream);
      return this.localStream;
    } catch (err) {
      console.warn('[WebRTC] Kamera yoki mikrofonga ruxsat olinmadi:', err.message);
      // Fallback: Try audio only if video failed
      if (video) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          this.initVoiceActivityDetection('local', this.localStream);
          return this.localStream;
        } catch (e) {
          console.warn('[WebRTC] Mikrofonga ham ruxsat berilmadi');
        }
      }
      return null;
    }
  }

  // 2. Toggle local camera
  toggleCamera(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // 3. Toggle local mic
  toggleMic(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // 4. Create PeerConnection
  createPeerConnection(peerSocketId) {
    if (this.peerConnections.has(peerSocketId)) {
      return this.peerConnections.get(peerSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtc:ice-candidate', {
          toSocketId: peerSocketId,
          candidate: event.candidate
        });
      }
    };

    // Remote track received
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream && this.onRemoteStream) {
        this.onRemoteStream(peerSocketId, remoteStream);
        this.initVoiceActivityDetection(peerSocketId, remoteStream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(peerSocketId);
      }
    };

    this.peerConnections.set(peerSocketId, pc);
    return pc;
  }

  // 5. Send Offer to peer
  async callPeer(peerSocketId) {
    const pc = this.createPeerConnection(peerSocketId);
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      this.socket.emit('webrtc:offer', {
        toSocketId: peerSocketId,
        offer
      });
    } catch (err) {
      console.error('[WebRTC] Call peer error:', err);
    }
  }

  // 6. Handle incoming Offer
  async handleOffer(fromSocketId, offer) {
    const pc = this.createPeerConnection(fromSocketId);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.socket.emit('webrtc:answer', {
        toSocketId: fromSocketId,
        answer
      });
    } catch (err) {
      console.error('[WebRTC] Handle offer error:', err);
    }
  }

  // 7. Handle incoming Answer
  async handleAnswer(fromSocketId, answer) {
    const pc = this.peerConnections.get(fromSocketId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('[WebRTC] Handle answer error:', err);
      }
    }
  }

  // 8. Handle ICE candidate
  async handleCandidate(fromSocketId, candidate) {
    const pc = this.peerConnections.get(fromSocketId);
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[WebRTC] Candidate error:', err);
      }
    }
  }

  // 9. Voice Activity Detection (Speaking pulse)
  initVoiceActivityDetection(id, stream) {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      }
      if (!this.audioContext || !stream.getAudioTracks().length) return;

      const source = this.audioContext.createMediaStreamSource(stream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      this.analysers.set(id, analyser);

      if (!this.speakingInterval) {
        this.startSpeakingMonitor();
      }
    } catch (e) {
      // AudioContext may be blocked until user gesture
    }
  }

  startSpeakingMonitor() {
    const dataArray = new Uint8Array(128);
    this.speakingInterval = setInterval(() => {
      this.analysers.forEach((analyser, id) => {
        try {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const isSpeaking = average > 25; // threshold
          if (this.onSpeakingChange) {
            this.onSpeakingChange(id, isSpeaking);
          }
        } catch (e) {}
      });
    }, 200);
  }

  // 10. Close Peer
  closePeer(peerSocketId) {
    const pc = this.peerConnections.get(peerSocketId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerSocketId);
    }
    this.analysers.delete(peerSocketId);
    if (this.onPeerLeft) {
      this.onPeerLeft(peerSocketId);
    }
  }

  // 11. Cleanup all
  destroy() {
    if (this.speakingInterval) {
      clearInterval(this.speakingInterval);
      this.speakingInterval = null;
    }
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    this.analysers.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
  }
}
