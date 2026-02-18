import { snapProblem } from "@/lib/ai-service";
'use client';

import React, {
  useState,
  useRef,
  useEffect,
  DragEvent,
  ChangeEvent,
  MouseEvent,
} from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Brain,
  RotateCcw,
  Scan,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Zap,
  Loader2,
  X,
  SwitchCamera,
  Image,
} from 'lucide-react';
import cn from '@/lib/utils';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
type Mode = 'idle' | 'camera' | 'preview' | 'analyzing' | 'result';

interface AnalysisResult {
  image: string; // base64 string (same as uploaded)
  problemText: string;
  steps: string[];
}

// -----------------------------------------------------------------------------
// Mock data (used when API fails or in demo mode)
// -----------------------------------------------------------------------------
const MOCK_RESULT: AnalysisResult = {
  image: '',
  problemText: 'Solve for x: 2x + 5 = 15',
  steps: [
    'Step 1: Subtract 5 from both sides → 2x = 10',
    'Step 2: Divide both sides by 2 → x = 5',
  ],
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
export default function SnapProblem() {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [mode, setMode] = useState<Mode>('idle');
  const [imageData, setImageData] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [solutionOpen, setSolutionOpen] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>(
    'environment',
  );
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------
  // Start / stop camera when mode changes
  useEffect(() => {
    if (mode === 'camera') {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: cameraFacing },
        audio: false,
      };
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((e) => {
          console.error(e);
          setError('Unable to access camera. Please check permissions.');
          setMode('idle');
        });
    } else {
      // clean up previous stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cameraFacing]);

  // -------------------------------------------------------------------------
  // Handlers – UI
  // -------------------------------------------------------------------------
  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
      setMode('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
      setMode('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setImageData(dataUrl);
    setMode('preview');
  };

  const cancelCamera = () => setMode('idle');

  const retake = () => {
    setImageData(null);
    setMode('idle');
  };

  const analyze = async () => {
    if (!imageData) return;
    setMode('analyzing');
    try {
      try {
        const data = await snapProblem(capturedImage || selectedText || "");
        setSolution(data);
    } catch (e) {
      console.error(e);
      // fallback to mock data
      setAnalysis({ ...MOCK_RESULT, image: imageData });
    } finally {
      setMode('result');
    }
  };

  const toggleSolution = () => setSolutionOpen((prev) => !prev);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------
  const renderIdle = () => (
    <div className="flex flex-col items-center gap-4 p-4">
      <button
        className={cn(
          'flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-white',
          'hover:bg-primary/90 transition',
        )}
        onClick={() => setMode('camera')}
      >
        <Camera size={20} />
        Take Photo
      </button>

      <button
        className={cn(
          'flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-white',
          'hover:bg-secondary/90 transition',
        )}
        onClick={openFilePicker}
      >
        <Upload size={20} />
        Upload Image
      </button>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        ref={dropZoneRef}
        className={cn(
          'flex w-full max-w-md flex-col items-center justify-center rounded-xl border-2 border-dashed',
          'border-gray-300 p-8 text-center',
          'dark:border-gray-600',
          'hover:border-primary transition',
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Image size={48} className="text-gray-400 dark:text-gray-500" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Drag & drop an image here
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );

  const renderCamera = () => (
    <div className="relative flex flex-col items-center gap-4 p-4">
      <video
        ref={videoRef}
        className="w-full max-w-lg rounded-xl bg-black object-cover"
        playsInline
        muted
      />
      {/* Flash overlay (visual only) */}
      {flashOn && (
        <div className="pointer-events-none absolute inset-0 animate-flash bg-white opacity-30" />
      )}
      <div className="absolute bottom-4 flex w-full max-w-lg justify-between px-4">
        <button
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full bg-white/80',
            'shadow-md hover:bg-white transition',
          )}
          onClick={cancelCamera}
        >
          <X size={24} className="text-gray-800" />
        </button>

        <button
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full bg-primary',
            'shadow-xl hover:bg-primary/90 transition animate-pulse',
          )}
          onClick={capturePhoto}
        >
          <Camera size={28} className="text-white" />
        </button>

        <button
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full bg-white/80',
            'shadow-md hover:bg-white transition',
          )}
          onClick={() =>
            setCameraFacing((f) => (f === 'user' ? 'environment' : 'user'))
          }
        >
          <SwitchCamera size={24} className="text-gray-800" />
        </button>

        <button
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full bg-white/80',
            'shadow-md hover:bg-white transition',
          )}
          onClick={() => setFlashOn((v) => !v)}
        >
          <Zap size={24} className={flashOn ? 'text-yellow-400' : 'text-gray-600'} />
        </button>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="flex flex-col items-center gap-4 p-4">
      {imageData && (
        <img
          src={imageData}
          alt="Captured"
          className="w-full max-w-lg rounded-xl object-cover"
        />
      )}
      <div className="flex gap-4">
        <button
          className={cn(
            'flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-white',
            'hover:bg-primary/90 transition',
          )}
          onClick={analyze}
        >
          <Brain size={20} />
          <Sparkles size={20} />
          Analyze
        </button>

        <button
          className={cn(
            'flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-white',
            'hover:bg-secondary/90 transition',
          )}
          onClick={retake}
        >
          <RotateCcw size={20} />
          Retake
        </button>
      </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="flex flex-col items-center gap-4 p-4">
      {imageData && (
        <img
          src={imageData}
          alt="Analyzing"
          className="w-full max-w-lg rounded-xl object-cover"
        />
      )}
      <div className="flex flex-col items-center gap-2">
        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Analyzing your problem...
        </p>
        <div className="relative h-2 w-64 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div className="absolute inset-0 animate-scanning-line bg-purple-500" />
        </div>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <Loader2
              key={i}
              size={20}
              className="animate-spin text-primary"
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderResult = () => {
    const result = analysis ?? MOCK_RESULT;
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        {/* Small image at top */}
        {result.image && (
          <img
            src={result.image}
            alt="Result"
            className="w-48 rounded-xl object-cover opacity-80"
          />
        )}

        {/* Problem card */}
        <div className="w-full max-w-lg rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Problem Detected
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{result.problemText}</p>
        </div>

        {/* Solution accordion */}
        <div className="w-full max-w-lg rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700">
          <button
            className="flex w-full items-center justify-between p-4"
            onClick={toggleSolution}
          >
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Step‑by‑Step Solution
            </span>
            {solutionOpen ? (
              <ChevronUp size={20} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>
          {solutionOpen && (
            <ol className="list-decimal space-y-2 p-4 pt-0 text-gray-700 dark:text-gray-300">
              {result.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          )}
        </div>

        {/* Follow‑up button */}
        <button
          className={cn(
            'flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-white',
            'hover:bg-primary/90 transition',
          )}
          onClick={() => console.log('Ask follow‑up (to be wired to chat)')}
        >
          <MessageCircle size={20} />
          Ask Follow‑up
        </button>

        {/* Similar problems */}
        <div className="w-full max-w-lg rounded-xl border bg-white p-4 dark:bg-gray-800 dark:border-gray-700">
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Similar Problems
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-gray-700 dark:text-gray-300">
            <li>Quadratic equation: 3x² – 12x + 9 = 0</li>
            <li>Linear system: 2x + 3y = 7, 4x – y = 5</li>
            <li>Geometry: Find the area of a triangle with sides 5, 7, 8</li>
          </ul>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------
  return (
    <section className="mx-auto max-w-2xl">
      {mode === 'idle' && renderIdle()}
      {mode === 'camera' && renderCamera()}
      {mode === 'preview' && renderPreview()}
      {mode === 'analyzing' && renderAnalyzing()}
      {mode === 'result' && renderResult()}

      {/* ------------------------------------------------------------------- */}
      {/* Inline Tailwind CSS for custom animations (scanning line, flash)   */}
      {/* ------------------------------------------------------------------- */}
      <style jsx>{`
        @keyframes scanning {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-scanning-line {
          animation: scanning 1.5s linear infinite;
        }
        @keyframes flash {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-flash {
          animation: flash 0.2s ease-out;
        }
      `}</style>
    </section>
  );
}