import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Target,
  Flame,
  TrendingUp,
  Brain,
  BookOpen,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Calendar,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PerformanceEntry = { date: string; score: number };
type RadarEntry = { topic: string; mastery: number };
type HeatmapCell = number; // 0‑9 activity level

const AnalyticsDashboard: React.FC = () => {
  // ----- Mock Data -----
  const [totalStudyTime] = useState('12h 34m');
  const [quizAverageTarget] = useState(87);
  const [flashcardsMasteredTarget] = useState(142);
  const [totalFlashcards] = useState(200);
  const [studyStreakTarget] = useState(7);
  const [performanceData] = useState<PerformanceEntry[]>([
    { date: 'Jan 1', score: 80 },
    { date: 'Jan 3', score: 90 },
    { date: 'Jan 5', score: 70 },
    { date: 'Jan 7', score: 85 },
    { date: 'Jan 9', score: 95 },
    { date: 'Jan 11', score: 75 },
    { date: 'Jan 13', score: 80 },
  ]);
  const [radarData] = useState<RadarEntry[]>([
    { topic: 'Biology', mastery: 0.8 },
    { topic: 'Chemistry', mastery: 0.7 },
    { topic: 'Physics', mastery: 0.9 },
    { topic: 'Math', mastery: 0.6 },
    { topic: 'History', mastery: 0.8 },
    { topic: 'English', mastery: 0.7 },
  ]);
  const [heatmapData] = useState<HeatmapCell[][]>(
    Array.from({ length: 7 }, () =>
      Array.from({ length: 12 }, () => Math.floor(Math.random() * 10))
    )
  );
  const [activityFeed] = useState([
    {
      type: 'quiz',
      description: 'Completed Quiz: Biology 101 — 92%',
      timestamp: '2024‑01‑15 10:00',
    },
    {
      type: 'flashcards',
      description: 'Reviewed 15 flashcards — Cell Division',
      timestamp: '2024‑01‑14 12:00',
    },
  ]);

  // ----- Animated Numbers -----
  const [quizAverage, setQuizAverage] = useState(0);
  const [flashcardsMastered, setFlashcardsMastered] = useState(0);
  const [studyStreak, setStudyStreak] = useState(0);

  const animateValue = (
    start: number,
    end: number,
    setter: (v: number) => void,
    duration = 800
  ) => {
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setter(Math.round(start + (end - start) * progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    animateValue(0, quizAverageTarget, setQuizAverage);
    animateValue(0, flashcardsMasteredTarget, setFlashcardsMastered);
    animateValue(0, studyStreakTarget, setStudyStreak);
  }, []);

  // ----- Radar Animation -----
  const radarRef = useRef<SVGPathElement>(null);
  useEffect(() => {
    const path = radarRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.getBoundingClientRect(); // trigger layout
    path.style.transition = 'stroke-dashoffset 1s ease-out';
    path.style.strokeDashoffset = '0';
  }, []);

  // ----- Bar Chart Entrance Animation -----
  const barRefs = useRef<Array<SVGRectElement | null>>([]);
  useEffect(() => {
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const height = bar.getAttribute('data-height') ?? '0';
      bar.setAttribute('height', '0');
      bar.setAttribute('y', '100%');
      setTimeout(() => {
        bar.style.transition = 'height 0.6s ease-out, y 0.6s ease-out';
        bar.setAttribute('height', height);
        bar.setAttribute('y', `${100 - parseFloat(height)}%`);
      }, i * 100);
    });
  }, []);

  // ----- Helper for heatmap color -----
  const heatColor = (level: number) => {
    if (level >= 7) return 'bg-green-600';
    if (level >= 4) return 'bg-green-400';
    if (level > 0) return 'bg-green-200';
    return 'bg-gray-200';
  };

  return (
    <div className="p-4 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Study Time */}
        <div
          className={cn(
            'p-4 rounded-2xl bg-white dark:bg-gray-800 border-l-4 border-blue-500',
            'flex flex-col items-center text-center'
          )}
        >
          <Clock className="w-6 h-6 text-blue-500" />
          <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {totalStudyTime}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            +2.5h vs last week
          </div>
        </div>

        {/* Quiz Average */}
        <div
          className={cn(
            'p-4 rounded-2xl bg-white dark:bg-gray-800 border-l-4 border-green-500',
            'flex flex-col items-center text-center'
          )}
        >
          <Target className="w-6 h-6 text-green-500" />
          <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {quizAverage}%
          </div>
          <svg className="w-16 h-16 mt-2" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="10"
              fill="none"
              className="text-gray-300 dark:text-gray-600"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="10"
              fill="none"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * quizAverage) / 100}
              className="text-green-500"
            />
          </svg>
        </div>

        {/* Flashcards Mastered */}
        <div
          className={cn(
            'p-4 rounded-2xl bg-white dark:bg-gray-800 border-l-4 border-yellow-500',
            'flex flex-col items-center text-center'
          )}
        >
          <BookOpen className="w-6 h-6 text-yellow-500" />
          <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {flashcardsMastered} / {totalFlashcards}
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
            <div
              className="h-2 bg-yellow-500"
              style={{
                width: `${(flashcardsMastered / totalFlashcards) * 100}%`,
                transition: 'width 0.6s ease-out',
              }}
            />
          </div>
        </div>

        {/* Study Streak */}
        <div
          className={cn(
            'p-4 rounded-2xl bg-white dark:bg-gray-800 border-l-4 border-red-500',
            'flex flex-col items-center text-center'
          )}
        >
          <Flame className="w-6 h-6 text-red-500 animate-bounce" />
          <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {studyStreak} days
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Study Streak</div>
        </div>
      </div>

      {/* Performance Chart */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Performance Chart
          </h2>
          <BarChart3 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </div>
        <svg className="w-full h-48" viewBox="0 0 100 100">
          {/* Y‑axis labels */}
          <text x="5" y="10" fontSize="3" fill="currentColor" className="text-gray-600 dark:text-gray-400">
            100%
          </text>
          <text x="5" y="90" fontSize="3" fill="currentColor" className="text-gray-600 dark:text-gray-400">
            0%
          </text>

          {/* Bars */}
          {performanceData.map((d, i) => {
            const barWidth = 8;
            const gap = 4;
            const x = i * (barWidth + gap) + 15;
            const height = (d.score / 100) * 80; // 80% of chart height
            return (
              <g key={i}>
                <rect
                  ref={el => (barRefs.current[i] = el)}
                  data-height={height}
                  x={x}
                  y={100}
                  width={barWidth}
                  height={0}
                  rx="2"
                  fill="url(#purpleGrad)"
                >
                  <title>{`${d.date}: ${d.score}%`}</title>
                </rect>
                <text
                  x={x + barWidth / 2}
                  y="95"
                  fontSize="3"
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-gray-600 dark:text-gray-400"
                >
                  {d.date}
                </text>
              </g>
            );
          })}

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7A288A" stopOpacity="1" />
              <stop offset="100%" stopColor="#7A288A" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>
      </section>

      {/* Topic Strength Radar */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Topic Strength Radar
          </h2>
          <Brain className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </div>
        <svg className="w-full h-48" viewBox="0 0 100 100">
          {/* Hexagon outline */}
          <polygon
            points="50,10 90,30 90,70 50,90 10,70 10,30"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-300 dark:text-gray-600"
          />
          {/* Filled mastery area */}
          <path
            ref={radarRef}
            fill="rgba(122,40,154,0.2)"
            stroke="none"
          />
          {/* Vertices & Labels */}
          {radarData.map((d, i) => {
            const angle = (Math.PI / 3) * i - Math.PI / 2; // start at top
            const radius = 40;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            return (
              <g key={i}>
                <line
                  x1="50"
                  y1="50"
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-gray-300 dark:text-gray-600"
                />
                <text
                  x={x}
                  y={y}
                  dy={i === 0 ? '-4' : i === 3 ? '6' : '4'}
                  textAnchor="middle"
                  fontSize="3"
                  fill="currentColor"
                  className="text-gray-600 dark:text-gray-400"
                >
                  {d.topic}
                </text>
              </g>
            );
          })}
        </svg>
      </section>

      {/* Activity Heatmap */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Activity Heatmap
          </h2>
          <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="grid grid-cols-12 gap-1">
          {heatmapData.map((week, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1">
              {week.map((level, rowIdx) => (
                <div
                  key={rowIdx}
                  className={cn(
                    'w-5 h-5 rounded-sm',
                    heatColor(level)
                  )}
                  title={`Jan ${15 + rowIdx}: ${level}h studied`}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity Feed */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 max-h-64 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Activity Feed
          </h2>
          <Activity className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </div>
        <ul className="space-y-3">
          {activityFeed.map((a, i) => (
            <li key={i} className="flex items-start gap-3">
              {a.type === 'quiz' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col">
                <span className="text-gray-900 dark:text-gray-100">{a.description}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{a.timestamp}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AnalyticsDashboard;