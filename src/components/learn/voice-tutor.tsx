'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Loader2,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import cn from '@/lib/utils';
import axios from 'axios';

interface VoiceTutorProps {
  documentId?: string;
  spaceId?: string;
  onClose?: () => void;
}

/** Conversation entry */
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

enum TutorState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  SPEAKING = 'SPEAKING',
}

/** Helper to get SpeechRecognition constructor */
const getSpeechRecognition = (): typeof SpeechRecognition | null => {
  if (typeof window === 'undefined') return null;
  // @ts-ignore – vendor prefixed version
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const VoiceTutor: React.FC<VoiceTutorProps> = ({
  documentId,
  spaceId,
  onClose,
}) => {
  const [state, setState] = useState<TutorState>(TutorState.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statusText, setStatusText] = useState('Tap to speak');
  const [continuousMode, setContinuousMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSupported = !!getSpeechRecognition();

  /** Update status text based on state */
  useEffect(() => {
    switch (state) {
      case TutorState.IDLE:
        setStatusText('Tap to speak');
        break;
      case TutorState.LISTENING:
        setStatusText('Listening...');
        break;
      case TutorState.PROCESSING:
        setStatusText('Thinking...');
        break;
      case TutorState.SPEAKING:
        setStatusText('Speaking...');
        break;
    }
  }, [state]);

  /** Initialise SpeechRecognition */
  const initRecognition = () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      handleUserMessage(transcript);
    };

    recognition.onerror = () => {
      setState(TutorState.IDLE);
    };

    recognition.onend = () => {
      if (state === TutorState.LISTENING) {
        // If we reach here without a result, go back to idle
        setState(TutorState.IDLE);
      }
    };

    recognitionRef.current = recognition;
  };

  /** Start listening */
  const startListening = () => {
    if (!recognitionRef.current) return;
    setState(TutorState.LISTENING);
    recognitionRef.current.start();
  };

  /** Stop listening */
  const stopListening = () => {
    recognitionRef.current?.stop();
    setState(TutorState.IDLE);
  };

  /** Send user message to backend */
  const handleUserMessage = async (text: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setState(TutorState.PROCESSING);

    const token = localStorage.getItem('github_copilot_token') || '';
    const model = localStorage.getItem('selected_model') || 'gpt-4o';
    const systemMessage = documentId
      ? `Use the document ${documentId} for grounded answers.`
      : '';

    try {
      const response = await axios.post(
        '/api/chat',
        {
          messages: [
            ...messages.map((m) => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content,
            })),
            { role: 'user', content: text },
          ],
          systemMessage,
          model,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const aiReply = response.data?.reply || 'Sorry, I could not understand.';
      setMessages((prev) => [...prev, { role: 'assistant', content: aiReply }]);
      speak(aiReply);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error: unable to fetch response.' },
      ]);
      setState(TutorState.IDLE);
    }
  };

  /** Speak using SpeechSynthesis */
  const speak = (text: string) => {
    if (isMuted) {
      // Skip speaking but still transition to idle/continuous
      afterSpeak();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    // Pick a warm voice if available
    const voices = window.speechSynthesis.getVoices();
    const warmVoice = voices.find((v) => /female|en-us/i.test(v.name)) || voices[0];
    if (warmVoice) utterance.voice = warmVoice;
    utterance.rate = 1;
    utterance.onend = afterSpeak;
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setState(TutorState.SPEAKING);
  };

  /** Called after TTS finishes */
  const afterSpeak = () => {
    if (continuousMode) {
      startListening();
    } else {
      setState(TutorState.IDLE);
    }
  };

  /** Header button handlers */
  const toggleContinuous = () => setContinuousMode((v) => !v);
  const toggleMute = () => setIsMuted((v) => !v);
  const handleClose = () => onClose?.();

  /** Initialise on mount */
  useEffect(() => {
    initRecognition();
    // Pre‑load voices (some browsers load asynchronously)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
    // Cleanup on unmount
    return () => {
      recognitionRef.current?.abort();
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isSupported) {
    return (
      <div className="p-4 text-center text-red-600">
        Speech recognition is not supported in this browser.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Mic size={20} />
          <h2 className="text-lg font-semibold">Voice Tutor</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleContinuous}
            className={cn(
              'flex items-center px-3 py-1 rounded transition-colors',
              continuousMode
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
            )}
          >
            <Sparkles size={16} className="mr-1" />
            Continuous
          </button>
          <button
            onClick={toggleMute}
            className={cn(
              'p-2 rounded transition-colors',
              isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700',
            )}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Conversation */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl break-words',
                msg.role === 'user'
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'bg-purple-100 dark:bg-purple-900 text-gray-900 dark:text-gray-100',
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </main>

      {/* Controls */}
      <footer className="flex flex-col items-center py-6 space-y-2">
        <div className="relative">
          {/* Mic button */}
          <button
            onClick={() => {
              if (state === TutorState.LISTENING) stopListening();
              else startListening();
            }}
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center transition-transform',
              state === TutorState.LISTENING && 'animate-pulse',
            )}
          >
            {state === TutorState.LISTENING ? (
              <Mic size={48} className="text-purple-600" />
            ) : (
              <Mic size={48} className="text-gray-600 dark:text-gray-300" />
            )}
            {/* Ripple effect */}
            {state === TutorState.LISTENING && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-purple-500 opacity-75 animate-[ripple1_1.5s_ease-out_infinite]" />
                <span className="absolute inset-0 rounded-full border-2 border-purple-500 opacity-50 animate-[ripple2_1.5s_ease-out_infinite] delay-150" />
                <span className="absolute inset-0 rounded-full border-2 border-purple-500 opacity-25 animate-[ripple3_1.5s_ease-out_infinite] delay-300" />
              </>
            )}
          </button>

          {/* Speaking waveform */}
          {state === TutorState.SPEAKING && (
            <div className="absolute inset-x-0 -bottom-8 flex justify-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-8 bg-purple-600 rounded-full animate-[wave_1s_ease-in-out_infinite]"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Status text */}
        <p className="text-sm text-gray-600 dark:text-gray-300">{statusText}</p>

        {/* Processing spinner */}
        {state === TutorState.PROCESSING && (
          <Loader2 className="animate-spin text-purple-600" size={24} />
        )}
      </footer>

      {/* Inline keyframes for ripple & waveform */}
      <style jsx>{`
        @keyframes ripple1 {
          0% {
            transform: scale(0.8);
            opacity: 0.7;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes ripple2 {
          0% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes ripple3 {
          0% {
            transform: scale(0.8);
            opacity: 0.3;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes wave {
          0%,
          100% {
            height: 8px;
          }
          50% {
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceTutor;