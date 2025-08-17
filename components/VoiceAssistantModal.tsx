import React, { useState, useEffect, useRef, useCallback } from 'react';
import { solveMathProblem } from '../services/geminiService';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void; // This is now the "hang up" function
}

const AiAvatar = ({ status }: { status: string }) => {
  const baseRing = "absolute rounded-full border-2 transition-all duration-500";
  let statusClasses = {
    ring1: "border-indigo-400",
    ring2: "border-indigo-500",
    ring3: "border-indigo-600",
  };

  switch (status) {
    case 'listening':
      statusClasses = {
        ring1: "border-red-400 animate-ping opacity-75",
        ring2: "border-red-500",
        ring3: "border-red-600",
      };
      break;
    case 'processing':
      statusClasses = {
        ring1: "border-purple-400 animate-spin",
        ring2: "border-purple-500 animate-spin [animation-direction:reverse]",
        ring3: "border-purple-600 animate-spin",
      };
      break;
    case 'speaking':
       statusClasses = {
        ring1: "border-green-400 scale-125 opacity-0 animate-pulse",
        ring2: "border-green-500 scale-110 opacity-50 animate-pulse [animation-delay:200ms]",
        ring3: "border-green-600",
      };
      break;
    default: // idle or connecting
       statusClasses = {
        ring1: "border-indigo-400 animate-pulse",
        ring2: "border-indigo-500 animate-pulse [animation-delay:200ms]",
        ring3: "border-indigo-600",
      };
      break;
  }

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <div className={`${baseRing} w-24 h-24 ${statusClasses.ring3}`}></div>
      <div className={`${baseRing} w-32 h-32 ${statusClasses.ring2}`}></div>
      <div className={`${baseRing} w-40 h-40 ${statusClasses.ring1}`}></div>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </div>
  );
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


const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'idle' | 'listening' | 'processing' | 'speaking'>('connecting');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const recognitionRef = useRef<any>(null);
  const statusRef = useRef(status);

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


  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => setStatus('idle');
    utterance.onerror = () => {
        console.error("Speech synthesis error");
        setStatus('idle');
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleMicClick = useCallback(() => {
    if (status !== 'idle' && status !== 'listening') return;

    if (status === 'listening') {
      recognitionRef.current?.stop();
      setStatus('idle');
      return;
    }
    
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
      setTranscript(spokenText);
      setStatus('processing');
      const response = await solveMathProblem(spokenText);
      setAiResponse(response);
      speak(response);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setStatus('idle');
    };
    
    recognition.onend = () => {
        if (statusRef.current === 'listening') {
            setStatus('idle');
        }
    };

    recognition.start();
  }, [status, speak]);

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
        <AiAvatar status={status} />
        <h2 className="text-3xl font-bold mt-8">AI Math Tutor</h2>
        <p className="text-slate-300 mt-2 text-lg h-14">{getStatusText()}</p>
      </div>

      <div className="flex flex-col items-center w-full">
        <button 
          onClick={handleMicClick} 
          disabled={status !== 'idle' && status !== 'listening'}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-900
            ${status === 'listening' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}
            disabled:bg-slate-500 disabled:cursor-not-allowed`}
          aria-label={status === 'listening' ? 'Stop listening' : 'Start listening'}
        >
          <MicrophoneIcon />
        </button>

        <button 
          onClick={onClose} 
          className="mt-12 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-transform hover:scale-105"
          aria-label="End call"
        >
          <HangUpIcon />
          <span>Hang Up</span>
        </button>
      </div>
    </div>
  );
};

export default VoiceAssistantModal;
