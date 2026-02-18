"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RotateCcw,
  Clock,
  Flame,
  CheckCircle2,
  Brain,
  Calendar,
  ChevronRight,
  Sparkles,
  PartyPopper,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SpacedRepetitionProps {
  documentId?: string;
  spaceId?: string;
}

/* ------------------------------- Types ------------------------------- */
type CardStatus = "new" | "learning" | "review";

interface Card {
  id: string;
  front: string;
  back: string;
  interval: number; // days
  easeFactor: number; // starts at 2.5
  repetitions: number;
  nextReview: number; // timestamp (ms)
  status: CardStatus;
}

/* --------------------------- Helper Utils --------------------------- */
const STORAGE_KEY = (spaceId?: string) => `relearn-srs-${spaceId ?? "global"}`;

const loadCards = (spaceId?: string): Card[] => {
  const raw = localStorage.getItem(STORAGE_KEY(spaceId));
  if (raw) {
    try {
      return JSON.parse(raw) as Card[];
    } catch {
      // ignore parse errors
    }
  }
  // fallback: empty deck (in real app you would fetch from server)
  return [];
};

const saveCards = (spaceId: string | undefined, cards: Card[]) => {
  localStorage.setItem(STORAGE_KEY(spaceId), JSON.stringify(cards));
};

const formatDuration = (ms: number) => {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

/* --------------------------- Main Component -------------------------- */
export default function SpacedRepetition({
  documentId,
  spaceId,
}: SpacedRepetitionProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionStart, setSessionStart] = useState(Date.now());
  const [showCelebration, setShowCelebration] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  /* --------------------------- Load / Init -------------------------- */
  useEffect(() => {
    const stored = loadCards(spaceId);
    // If no cards, create a mock deck (replace with real fetch)
    if (stored.length === 0) {
      const mock: Card[] = Array.from({ length: 20 }, (_, i) => ({
        id: `c${i}`,
        front: `Front of card ${i + 1}`,
        back: `Back of card ${i + 1}`,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        nextReview: Date.now(),
        status: "new",
      }));
      setCards(mock);
      saveCards(spaceId, mock);
    } else {
      setCards(stored);
    }
    setSessionStart(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId]);

  /* --------------------------- Derived Data -------------------------- */
  const dueCards = useMemo(
    () =>
      cards.filter((c) => c.nextReview <= Date.now()).sort(
        (a, b) => a.nextReview - b.nextReview
      ),
    [cards]
  );

  const currentCard = dueCards[currentIdx];

  const stats = useMemo(() => {
    const newCount = cards.filter((c) => c.status === "new").length;
    const learningCount = cards.filter((c) => c.status === "learning").length;
    const reviewCount = cards.filter((c) => c.status === "review").length;
    const dueToday = cards.filter(
      (c) => new Date(c.nextReview).toDateString() === new Date().toDateString()
    ).length;
    return { newCount, learningCount, reviewCount, dueToday };
  }, [cards]);

  const completedToday = useMemo(() => {
    const today = new Date().toDateString();
    return cards.filter(
      (c) => new Date(c.nextReview).toDateString() !== today && c.repetitions > 0
    ).length;
  }, [cards]);

  const totalDue = dueCards.length;

  /* --------------------------- SM‑2 Logic --------------------------- */
  const updateCard = (card: Card, quality: number) => {
    // quality: 0=Again,1=Hard,2=Good,3=Easy
    const newCard = { ...card };
    // Adjust ease factor (simplified)
    const qualityMap = [0, 0.5, 0.8, 1];
    const q = qualityMap[quality];
    newCard.easeFactor = Math.max(
      1.3,
      newCard.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    );

    if (quality === 0) {
      // Again
      newCard.interval = 0;
      newCard.repetitions = 0;
      newCard.nextReview = Date.now() + 60 * 1000; // 1 min
      newCard.status = "learning";
    } else if (quality === 1) {
      // Hard
      newCard.interval = Math.max(1, Math.round(newCard.interval * 1.2));
      newCard.repetitions += 1;
      newCard.nextReview = Date.now() + 10 * 60 * 1000; // 10 min
      newCard.status = "learning";
    } else if (quality === 2) {
      // Good
      if (newCard.repetitions === 0) newCard.interval = 1;
      else if (newCard.repetitions === 1) newCard.interval = 6;
      else newCard.interval = Math.round(newCard.interval * newCard.easeFactor);
      newCard.repetitions += 1;
      newCard.nextReview = Date.now() + newCard.interval * 24 * 60 * 60 * 1000;
      newCard.status = "review";
    } else if (quality === 3) {
      // Easy
      newCard.interval = Math.round(
        newCard.interval * newCard.easeFactor * 1.3
      );
      newCard.repetitions += 1;
      newCard.nextReview = Date.now() + newCard.interval * 24 * 60 * 60 * 1000;
      newCard.status = "review";
    }
    return newCard;
  };

  const handleResponse = (quality: number) => {
    if (!currentCard) return;
    const updated = updateCard(currentCard, quality);
    const newCards = cards.map((c) => (c.id === updated.id ? updated : c));
    setCards(newCards);
    saveCards(spaceId, newCards);
    // move to next card
    setFlipped(false);
    if (currentIdx + 1 >= dueCards.length) {
      // end of session
      setShowCelebration(true);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  /* --------------------------- Keyboard Shortcuts --------------------------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showCelebration) return;
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (!flipped) return; // only accept answers after flip
      switch (e.key) {
        case "1":
          handleResponse(0);
          break;
        case "2":
          handleResponse(1);
          break;
        case "3":
          handleResponse(2);
          break;
        case "4":
          handleResponse(3);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, currentIdx, dueCards, showCelebration]);

  /* --------------------------- Session Timer --------------------------- */
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - sessionStart);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [sessionStart]);

  /* --------------------------- Celebration --------------------------- */
  const Celebration = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <PartyPopper className="w-16 h-16 text-yellow-400 animate-bounce" />
      <h2 className="text-2xl font-bold mt-4">All caught up! 🎉</h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        Next review in{" "}
        {formatDuration(
          Math.max(
            0,
            Math.min(...cards.map((c) => c.nextReview)) - Date.now()
          )
        )}
      </p>
      <div className="mt-6 flex gap-4">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span>{cards.filter((c) => c.repetitions > 0).length} reviewed</span>
        </div>
        <div className="flex items-center gap-1">
          <Flame className="w-5 h-5 text-orange-500" />
          <span>
            {Math.round(
              (cards.filter((c) => c.repetitions > 0).length / cards.length) *
                100
            )}
            % accuracy
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-5 h-5 text-blue-500" />
          <span>{formatDuration(elapsed)}</span>
        </div>
      </div>
      {/* Simple confetti using CSS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: `hsl(${Math.random() * 360},70%,60%)`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        .confetti {
          position: absolute;
          bottom: -10px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: rise 3s forwards;
        }
        @keyframes rise {
          to {
            transform: translateY(-120vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );

  /* --------------------------- Progress Ring --------------------------- */
  const ProgressRing = ({
    percent,
  }: {
    percent: number;
  }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    return (
      <svg width={70} height={70} className="transform -rotate-90">
        <circle
          cx={35}
          cy={35}
          r={radius}
          stroke="currentColor"
          strokeWidth={6}
          className="text-gray-200 dark:text-gray-700"
          fill="transparent"
        />
        <circle
          cx={35}
          cy={35}
          r={radius}
          stroke="currentColor"
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-blue-500"
          fill="transparent"
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="text-sm font-medium fill-current"
        >
          {Math.round(percent)}%
        </text>
      </svg>
    );
  };

  /* --------------------------- Calendar Preview --------------------------- */
  const CalendarPreview = () => {
    const next7 = Array.from({ length: 7 }, (_, i) => {
      const day = new Date();
      day.setDate(day.getDate() + i);
      const count = cards.filter(
        (c) => new Date(c.nextReview).toDateString() === day.toDateString()
      ).length;
      return { day: day.toLocaleDateString(undefined, { weekday: "short" }), count };
    });
    return (
      <div className="flex space-x-2">
        {next7.map((d, i) => (
          <div key={i} className="flex flex-col items-center text-xs">
            <span>{d.day}</span>
            <div className="w-5 h-5 flex items-center justify-center bg-indigo-100 dark:bg-indigo-800 rounded-full">
              {d.count}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /* --------------------------- Main Render --------------------------- */
  if (showCelebration) {
    return <Celebration />;
  }

  return (
    <div className="flex flex-col h-full p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Stats Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="font-medium">{totalDue} cards left</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              New: {stats.newCount}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-500 rounded-full" />
              Learning: {stats.learningCount}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Review: {stats.reviewCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(elapsed)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Due today: {stats.dueToday}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ProgressRing percent={(completedToday / cards.length) * 100} />
          <CalendarPreview />
        </div>
      </div>

      {/* Card Viewer */}
      {currentCard ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div
            className={cn(
              "relative w-96 h-64 perspective-1000",
              "transition-transform duration-500",
              flipped ? "rotate-y-180" : ""
            )}
          >
            {/* Front */}
            <div
              className={cn(
                "absolute inset-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center p-4 backface-hidden",
                "transform transition-transform duration-500",
                flipped ? "rotate-y-180" : ""
              )}
            >
              <p className="text-lg">{currentCard.front}</p>
            </div>
            {/* Back */}
            <div
              className={cn(
                "absolute inset-0 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg flex items-center justify-center p-4 backface-hidden",
                "transform rotate-y-180 transition-transform duration-500",
                flipped ? "" : "rotate-y-180"
              )}
            >
              <p className="text-lg">{currentCard.back}</p>
            </div>
          </div>

          {/* Response Buttons */}
          {flipped && (
            <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-md">
              <button
                onClick={() => handleResponse(0)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Again
              </button>
              <button
                onClick={() => handleResponse(1)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
              >
                <Flame className="w-4 h-4" />
                Hard
              </button>
              <button
                onClick={() => handleResponse(2)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                Good
              </button>
              <button
                onClick={() => handleResponse(3)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
              >
                <Sparkles className="w-4 h-4" />
                Easy
              </button>
            </div>
          )}

          {/* Flip Hint */}
          {!flipped && (
            <button
              onClick={() => setFlipped(true)}
              className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition"
            >
              <ArrowRight className="w-4 h-4" />
              Press Space or Click to Flip
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No cards due right now.</p>
        </div>
      )}
    </div>
  );
}

/* --------------------------- CSS Helpers --------------------------- */
const style = `
.perspective-1000 {
  perspective: 1000px;
}
.backface-hidden {
  backface-visibility: hidden;
}
.rotate-y-180 {
  transform: rotateY(180deg);
}
`;
/* Inject helper styles */
if (typeof document !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.textContent = style;
  document.head.appendChild(styleTag);
}