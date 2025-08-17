import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { solveMathProblem } from '../services/geminiService';
import { useSpeech } from '../hooks/useSpeech';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Shaders for the 3D Blob ---
const vertexShader = `
  uniform float u_time;
  uniform float u_intensity;
  varying vec3 v_normal;
  varying vec2 v_uv;

  // Classic Perlin 3D Noise by Stefan Gustavson
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    v_normal = normal;
    v_uv = uv;
    float displacement = snoise(position + u_time * 0.1) * u_intensity;
    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 u_color_a;
  uniform vec3 u_color_b;
  varying vec3 v_normal;
  varying vec2 v_uv;

  void main() {
    float intensity = pow(0.6 - dot(v_normal, vec3(0.0, 0.0, 1.0)), 2.0);
    vec3 color = mix(u_color_a, u_color_b, intensity);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const STATUS_COLORS = {
    connecting: { a: new THREE.Color('#4338ca'), b: new THREE.Color('#a5b4fc') }, // indigo
    idle:       { a: new THREE.Color('#4338ca'), b: new THREE.Color('#a5b4fc') }, // indigo
    listening:  { a: new THREE.Color('#dc2626'), b: new THREE.Color('#fca5a5') }, // red
    processing: { a: new THREE.Color('#7e22ce'), b: new THREE.Color('#d8b4fe') }, // purple
    speaking:   { a: new THREE.Color('#16a34a'), b: new THREE.Color('#86efac') }, // green
};

const RealtimeVisualizer = ({ status }: { status: string }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const meshRef = useRef<THREE.Mesh | null>(null);
    const clockRef = useRef(new THREE.Clock());

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const smoothedVolumeRef = useRef(0);

    // One-time setup for Three.js scene
    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        // Renderer, Scene, Camera
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(250, 250);
        renderer.setPixelRatio(window.devicePixelRatio);
        mount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        sceneRef.current = scene;
        
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.z = 3;
        cameraRef.current = camera;

        // Geometry & Material
        const geometry = new THREE.IcosahedronGeometry(1, 64);
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_time: { value: 0 },
                u_intensity: { value: 0.15 },
                u_color_a: { value: STATUS_COLORS.connecting.a },
                u_color_b: { value: STATUS_COLORS.connecting.b },
            },
        });
        const mesh = new THREE.Mesh(geometry, material);
        meshRef.current = mesh;
        scene.add(mesh);
        
        let animationFrameId: number;
        // Animation loop
        const animate = () => {
            if (!meshRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;
            const elapsedTime = clockRef.current.getElapsedTime();
            
            let targetIntensity = 0.15; // Idle intensity
            const audioData = getAudioData();
            
            // Determine intensity based on status
            switch (status) {
                case 'listening':
                    targetIntensity = 0.15 + audioData * 2;
                    break;
                case 'processing':
                    targetIntensity = 0.3 + Math.sin(elapsedTime * 8) * 0.1;
                    break;
                case 'speaking':
                    targetIntensity = 0.2 + Math.sin(elapsedTime * 4) * 0.05;
                    break;
                default: // idle, connecting
                    break;
            }
            
            // Smoothly interpolate intensity
            const currentIntensity = (meshRef.current.material as THREE.ShaderMaterial).uniforms.u_intensity.value;
            (meshRef.current.material as THREE.ShaderMaterial).uniforms.u_intensity.value = THREE.MathUtils.lerp(currentIntensity, targetIntensity, 0.1);
            
            (meshRef.current.material as THREE.ShaderMaterial).uniforms.u_time.value = elapsedTime;
            meshRef.current.rotation.y = elapsedTime * 0.1;
            
            rendererRef.current.render(sceneRef.current, cameraRef.current);
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (mount && renderer.domElement) {
                mount.removeChild(renderer.domElement);
            }
            renderer.dispose();
            geometry.dispose();
            material.dispose();
        };
    }, []); // Empty array ensures this runs only once

    // Handle status changes for color
    useEffect(() => {
        if (meshRef.current) {
            const colors = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.idle;
            (meshRef.current.material as THREE.ShaderMaterial).uniforms.u_color_a.value = colors.a;
            (meshRef.current.material as THREE.ShaderMaterial).uniforms.u_color_b.value = colors.b;
        }
    }, [status]);

    const getAudioData = () => {
        if (analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            const sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
            const average = sum / dataArrayRef.current.length || 0;
            const normalized = average / 128; // Normalize to 0-2 range
            // Smooth the value
            smoothedVolumeRef.current = THREE.MathUtils.lerp(smoothedVolumeRef.current, normalized, 0.1);
            return smoothedVolumeRef.current;
        }
        return 0;
    };

    // Handle microphone connection
    useEffect(() => {
        const setupAudio = async () => {
            try {
                if (status === 'listening' && !streamRef.current) {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    streamRef.current = stream;
                    if (!audioContextRef.current) {
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                    }
                    const audioCtx = audioContextRef.current;
                    analyserRef.current = audioCtx.createAnalyser();
                    analyserRef.current.fftSize = 32;
                    dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
                    sourceRef.current = audioCtx.createMediaStreamSource(stream);
                    sourceRef.current.connect(analyserRef.current);
                } else if (status !== 'listening' && streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    sourceRef.current?.disconnect();
                    streamRef.current = null;
                    sourceRef.current = null;
                    smoothedVolumeRef.current = 0;
                }
            } catch (err) {
                console.error('Error accessing microphone:', err);
            }
        };
        setupAudio();

        return () => {
             if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                sourceRef.current?.disconnect();
                streamRef.current = null;
                sourceRef.current = null;
            }
        };
    }, [status]);

    return <div ref={mountRef} className="w-[250px] h-[250px]" />;
};


const HangUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.976.976 0 0 0-1.01.24l-1.5 1.5a13.3 13.3 0 0 1-6.1-6.1l1.5-1.5c.32-.32.36-.85.24-1.21-.37-1.11-.56-2.3-.56-3.53a1 1 0 0 0-1-1H4.01a1 1 0 0 0-1 1c0 9.39 7.61 17 17 17a1 1 0 0 0 1-1v-3.02a1 1 0 0 0-1-1.01z" transform="rotate(-135 12 12)" />
    </svg>
);

const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m7 10v4M5 11v3a7 7 0 0014 0v-3m-7-5a3 3 0 013 3v2a3 3 0 01-6 0v-2a3 3 0 013-3z" />
    </svg>
);

const MuteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51c.63-1.09.98-2.34.98-3.65 0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    </svg>
);

const UnmuteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
);


const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'idle' | 'listening' | 'processing' | 'speaking'>('connecting');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [shouldListenNext, setShouldListenNext] = useState(false);
  const recognitionRef = useRef<any>(null);
  const statusRef = useRef(status);
  const { speak } = useSpeech();

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const cleanUp = useCallback(() => {
    if (recognitionRef.current) {
        recognitionRef.current.abort();
    }
    window.speechSynthesis.cancel();
    setTranscript('');
    setAiResponse('');
  }, []);

  useEffect(() => {
    if (isOpen) {
        setStatus('connecting');
        const timer = setTimeout(() => setStatus('idle'), 1200); // Simulate connection
        return () => {
            clearTimeout(timer);
            cleanUp();
        };
    }
  }, [isOpen, cleanUp]);


  const performSpeak = useCallback((text: string) => {
    if (isMuted) {
      setStatus('speaking'); // Brief visual cue
      const timer = setTimeout(() => {
        // Only set to idle if we haven't been interrupted
        if (statusRef.current === 'speaking') {
            setStatus('idle');
            setShouldListenNext(true);
        }
      }, 750);
      return;
    }

    const utterance = speak(text);
    if (utterance) {
      utterance.onstart = () => setStatus('speaking');
      utterance.onend = () => {
        // If we were interrupted, the status will no longer be 'speaking'.
        // This prevents the auto-listen from firing after a user barge-in.
        if (statusRef.current === 'speaking') {
            setStatus('idle');
            setShouldListenNext(true);
        }
      };
      utterance.onerror = (e) => {
          console.error("Speech synthesis error:", e);
          if (statusRef.current === 'speaking') {
            setStatus('idle');
          }
      };
    } else {
        console.error("Could not create utterance, speech might not be supported.");
        setStatus('idle');
    }
  }, [speak, isMuted]);

  const handleMicClick = useCallback(() => {
    switch (status) {
      case 'listening':
        // If already listening, stop. The onend handler will set status to 'idle'.
        recognitionRef.current?.stop();
        break;

      case 'speaking':
        // If speaking, interrupt and start listening (barge-in).
        window.speechSynthesis.cancel();
        // Fallthrough to 'idle' case is intended to start recognition immediately.
      
      case 'idle':
        // Start listening.
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          alert("Speech Recognition API is not supported in this browser.");
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setTranscript('');
            setAiResponse('');
            setStatus('listening');
        };

        recognition.onresult = async (event: any) => {
          const spokenText = event.results[0][0].transcript;
          recognition.stop();
          setTranscript(spokenText);
          setStatus('processing');
          const response = await solveMathProblem(spokenText);
          setAiResponse(response);
          performSpeak(response);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (statusRef.current === 'listening') setStatus('idle');
        };
        
        recognition.onend = () => {
            if (statusRef.current === 'listening') {
                setStatus('idle');
            }
        };

        recognition.start();
        break;
      
      // Do nothing for 'connecting' and 'processing'
      default:
        break;
    }
  }, [status, performSpeak]);
  
    // This effect handles auto-listening after the AI finishes speaking
    useEffect(() => {
        if (shouldListenNext && status === 'idle') {
        handleMicClick();
        setShouldListenNext(false);
        }
    }, [shouldListenNext, status, handleMicClick]);

  const getStatusText = () => {
    switch(status) {
        case 'connecting': return 'Connecting to AI Tutor...';
        case 'listening': return 'I\'m listening...';
        case 'processing': return `Thinking about: "${transcript}"`;
        case 'speaking': return 'Here is the solution...';
        case 'idle': 
            return 'Ready to help. Tap the mic to talk.';
        default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-95 backdrop-blur-sm z-50 flex flex-col items-center justify-between p-8 text-white transition-opacity duration-300"
         aria-modal="true" role="dialog">
      
      <div className="flex flex-col items-center justify-center text-center flex-1">
        <RealtimeVisualizer status={status} />
        <h2 className="text-3xl font-bold mt-8">AI Tutor</h2>
        <p className="text-slate-300 mt-2 text-lg h-14">{getStatusText()}</p>
      </div>

      <div className="flex flex-col items-center w-full">
        <button 
          onClick={handleMicClick} 
          disabled={status === 'connecting' || status === 'processing'}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-900
            ${status === 'listening' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}
            disabled:bg-slate-500 disabled:cursor-not-allowed`}
          aria-label={status === 'listening' ? 'Stop listening' : status === 'speaking' ? 'Interrupt and listen' : 'Start listening'}
        >
          <MicrophoneIcon />
        </button>

        <div className="mt-12 flex items-center justify-center w-full gap-8">
            <button
                onClick={() => setIsMuted(!isMuted)}
                className={`bg-slate-600 hover:bg-slate-500 text-white font-bold p-4 rounded-full transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-400
                    ${status === 'speaking' && !isMuted ? 'animate-pulse ring-2 ring-green-400' : ''}
                `}
                aria-label={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? <MuteIcon /> : <UnmuteIcon />}
            </button>
            <button 
              onClick={onClose} 
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-transform hover:scale-105"
              aria-label="End call"
            >
              <HangUpIcon />
              <span>Hang Up</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantModal;