import { generatePodcast } from "@/lib/ai-service";
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Mic,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PodcastPlayerProps {
  documentId?: string;
  spaceId?: string;
}

interface Segment {
  text: string;
  host: 'Alex' | 'Sam';
  emotion: 'excited' | 'thoughtful' | 'curious' | 'emphatic';
}

interface PodcastData {
  title: string;
  segments: Segment[];
}

const speedOptions = [0.75, 1, 1.25, 1.5] as const;

const PodcastPlayer: React.FC<PodcastPlayerProps> = ({ documentId, spaceId }) => {
  const [podcastData, setPodcastData] = useState<PodcastData | null>(null);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof speedOptions)[number]>(1);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch podcast data
  const fetchPodcast = useCallback(async () => {
    setLoading(true);
    try {
    try {
      const data = await generatePodcast(documentId, spaceId);
      if (data?.segments) {
        setSegments(data.segments);
        setTitle(data.title || "AI Podcast");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (documentId || spaceId) {
      fetchPodcast();
    }
  }, [documentId, spaceId, fetchPodcast]);

  // Auto‑scroll to current segment
  useEffect(() => {
    const el = segmentRefs.current[currentSegment];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentSegment]);

  // Speech synthesis handling
  useEffect(() => {
    if (!podcastData) return;

    const synth = window.speechSynthesis;

    const speak = () => {
      const segment = podcastData.segments[currentSegment];
      const utter = new SpeechSynthesisUtterance(segment.text);
      utter.pitch = segment.host === 'Alex' ? 0.9 : 1.1;
      utter.rate = speed;
      utter.onend = () => {
        setCurrentSegment((prev) => {
          const next = prev + 1;
          if (next < podcastData.segments.length) {
            return next;
          }
          setIsPlaying(false);
          return prev;
        });
      };
      utteranceRef.current = utter;
      synth.speak(utter);
    };

    if (isPlaying) {
      if (!synth.speaking) {
        speak();
      } else {
        // resume if paused
        synth.resume();
      }
    } else {
      synth.pause();
    }

    return () => {
      synth.cancel();
      utteranceRef.current = null;
    };
  }, [isPlaying, currentSegment, podcastData, speed]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const skipForward = () => {
    setCurrentSegment((prev) => Math.min(prev + 1, (podcastData?.segments.length ?? 1) - 1));
  };

  const skipBackward = () => {
    setCurrentSegment((prev) => Math.max(prev - 1, 0));
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpeed(parseFloat(e.target.value) as typeof speedOptions[number]);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await fetchPodcast();
  };

  // Loading / generate UI
  if (generating || loading || !podcastData) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        {generating || loading ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="animate-spin text-purple-600" size={32} />
            <p className="text-gray-700 dark:text-gray-300">Generating your podcast...</p>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            className={cn(
              'flex items-center justify-center w-full py-3 px-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:from-purple-600 hover:to-purple-700 transition',
              'dark:from-purple-700 dark:to-purple-800 dark:hover:from-purple-800 dark:hover:to-purple-900'
            )}
          >
            <Mic className="mr-2" size={20} />
            <Sparkles className="mr-2" size={20} />
            Generate Podcast
          </button>
        )}
      </div>
    );
  }

  // Main player UI
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
      {/* Waveform & Controls */}
      <div className="flex flex-col items-center space-y-4">
        {/* Waveform */}
        <div className="flex items-end space-x-1 h-12">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 bg-purple-500 rounded-full animate-[bounce_1s_ease-in-out_infinite]"
              style={{
                animationDelay: `${i * 0.15}s`,
                animationName: 'bounce',
              }}
            />
          ))}
          <style>{`
            @keyframes bounce {
              0%, 100% { height: 0.5rem; }
              50% { height: 1.5rem; }
            }
          `}</style>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{podcastData.title}</h2>

        {/* Segment Indicator */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Segment {currentSegment + 1} of {podcastData.segments.length}
        </p>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
            style={{
              width: `${((currentSegment + 1) / podcastData.segments.length) * 100}%`,
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={skipBackward}
            className={cn(
              'p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition'
            )}
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlay}
            className={cn(
              'flex items-center justify-center px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:from-purple-600 hover:to-purple-700 transition',
              'dark:from-purple-700 dark:to-purple-800 dark:hover:from-purple-800 dark:hover:to-purple-900'
            )}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          <button
            onClick={skipForward}
            className={cn(
              'p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition'
            )}
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Speed Control */}
        <select
          value={speed}
          onChange={handleSpeedChange}
          className={cn(
            'px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none'
          )}
        >
          {speedOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}x
            </option>
          ))}
        </select>
      </div>

      {/* Transcript */}
      <div className="mt-6 max-h-64 overflow-y-auto space-y-4">
        {podcastData.segments.map((segment, idx) => (
          <div
            key={idx}
            ref={(el) => (segmentRefs.current[idx] = el)}
            className={cn(
              'p-4 rounded-md border border-gray-200 dark:border-gray-600',
              idx === currentSegment
                ? 'border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                : 'bg-white dark:bg-gray-800'
            )}
          >
            <div className="flex items-center mb-2">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-white font-bold',
                  segment.host === 'Alex' ? 'bg-purple-500' : 'bg-blue-500'
                )}
              >
                {segment.host.charAt(0)}
              </div>
              <span className="ml-2 font-semibold text-gray-800 dark:text-gray-200">{segment.host}</span>
              <span
                className={cn(
                  'ml-2 w-2 h-2 rounded-full',
                  segment.emotion === 'excited'
                    ? 'bg-amber-400'
                    : segment.emotion === 'thoughtful'
                    ? 'bg-purple-500'
                    : segment.emotion === 'curious'
                    ? 'bg-blue-500'
                    : 'bg-green-500'
                )}
              />
            </div>
            <p className="text-gray-700 dark:text-gray-300">{segment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PodcastPlayer;