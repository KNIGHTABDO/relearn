import { generateStudyPlan } from "@/lib/ai-service";
"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Sparkles,
  BookOpen,
  BarChart3,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Topic = {
  id: string;
  name: string;
  strength: "weak" | "medium" | "strong";
  color: string; // Tailwind bg color e.g. "bg-emerald-200"
  estimatedHours: number;
};

type StudyBlock = {
  id: string;
  topicId: string;
  title: string;
  duration: number; // minutes
};

type DailyTask = {
  id: string;
  title: string;
  completed: boolean;
};

type DailyPlan = {
  day: string; // "Mon".."Sun"
  blocks: StudyBlock[];
  tasks: DailyTask[];
};

type StudyPlanResponse = {
  weekly: DailyPlan[];
  topics: Topic[];
  stats: {
    totalHours: number;
    mastered: number;
    totalTopics: number;
    streak: number;
    improvement: number; // percent
  };
};

interface StudyPlannerProps {
  spaceId?: string;
}

/* -------------------- Mock Data (demo mode) -------------------- */
const mockPlan: StudyPlanResponse = {
  weekly: [
    {
      day: "Mon",
      blocks: [
        { id: "b1", topicId: "t1", title: "Intro to Algebra", duration: 45 },
        { id: "b2", topicId: "t2", title: "Photosynthesis", duration: 30 },
      ],
      tasks: [
        { id: "t1", title: "Review notes", completed: false },
        { id: "t2", title: "Complete quiz", completed: false },
      ],
    },
    {
      day: "Tue",
      blocks: [
        { id: "b3", topicId: "t3", title: "World War II", duration: 60 },
        { id: "b4", topicId: "t1", title: "Algebra practice", duration: 30 },
      ],
      tasks: [
        { id: "t3", title: "Read chapter 3", completed: false },
        { id: "t4", title: "Flashcards", completed: false },
      ],
    },
    // ... fill Sun similarly
    {
      day: "Wed",
      blocks: [],
      tasks: [],
    },
    {
      day: "Thu",
      blocks: [],
      tasks: [],
    },
    {
      day: "Fri",
      blocks: [],
      tasks: [],
    },
    {
      day: "Sat",
      blocks: [],
      tasks: [],
    },
    {
      day: "Sun",
      blocks: [],
      tasks: [],
    },
  ],
  topics: [
    {
      id: "t1",
      name: "Mathematics",
      strength: "medium",
      color: "bg-emerald-200",
      estimatedHours: 12,
    },
    {
      id: "t2",
      name: "Biology",
      strength: "weak",
      color: "bg-rose-200",
      estimatedHours: 8,
    },
    {
      id: "t3",
      name: "History",
      strength: "strong",
      color: "bg-sky-200",
      estimatedHours: 5,
    },
  ],
  stats: {
    totalHours: 14,
    mastered: 1,
    totalTopics: 3,
    streak: 4,
    improvement: 12,
  },
};

/* -------------------- Helper Components -------------------- */

function ProgressRing({
  radius = 40,
  stroke = 8,
  progress = 0,
}: {
  radius?: number;
  stroke?: number;
  progress: number;
}) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  return (
    <svg
      height={radius * 2}
      width={radius * 2}
      className="transform -rotate-90"
    >
      <circle
        stroke="currentColor"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        className="text-gray-200 dark:text-gray-700"
      />
      <circle
        stroke="currentColor"
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset }}
        className="text-emerald-500"
      />
    </svg>
  );
}

/* -------------------- Main Component -------------------- */

export default function StudyPlanner({ spaceId }: StudyPlannerProps) {
  const [plan, setPlan] = useState<StudyPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // fetch plan on mount or when spaceId changes
  useEffect(() => {
    async function fetchPlan() {
      setLoading(true);
      try {
      try {
        const data = await generateStudyPlan(documentText || topics.join(", "));
        if (data?.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
        if (data?.focusAreas) setFocusAreas(data.focusAreas);
        if (data?.stats) setStats(data.stats);
        setIsAiGenerated(true);
      } catch (e) {
        console.error(e);
        setPlan(mockPlan);
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, [spaceId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      try {
        const data = await generateStudyPlan(topics.join(", "));
        if (data?.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
        if (data?.focusAreas) setFocusAreas(data.focusAreas);
        if (data?.stats) setStats(data.stats);
        setIsAiGenerated(true);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !plan) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
      </div>
    );
  }

  const { weekly, topics, stats } = plan;
  const masteryPercent = Math.round(
    (stats.mastered / stats.totalTopics) * 100
  );

  return (
    <section className="p-4 space-y-6">
      {/* ----- Top Stats ----- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Study Time"
          value={`${stats.totalHours}h this week`}
        />
        <StatCard
          icon={<BarChart3 className="w-6 h-6" />}
          label="Mastered"
          value={`${stats.mastered}/${stats.totalTopics} topics`}
        />
        <StatCard
          icon={<Flame className="w-6 h-6" />}
          label="Streak"
          value={`${stats.streak} days`}
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Improvement"
          value={
            <span
              className={cn(
                "flex items-center",
                stats.improvement >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              )}
            >
              {stats.improvement >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-1 -scale-y-100" />
              )}
              {Math.abs(stats.improvement)}%
            </span>
          }
        />
      </div>

      {/* ----- Progress Ring ----- */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <ProgressRing progress={masteryPercent} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Brain className="w-8 h-8 text-emerald-500 mb-1" />
            <span className="text-lg font-medium">
              {masteryPercent}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Overall Mastery
            </span>
          </div>
        </div>
      </div>

      {/* ----- Focus Areas ----- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <h2 className="flex items-center text-xl font-semibold mb-3">
          <Target className="w-5 h-5 mr-2 text-emerald-600" />
          Focus Areas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topics
            .filter((t) => t.strength !== "strong")
            .map((topic) => (
              <div
                key={topic.id}
                className={cn(
                  "p-3 rounded-xl flex items-center space-x-3",
                  topic.color
                )}
              >
                <BookOpen className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                <div>
                  <p className="font-medium">{topic.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Estimated: {topic.estimatedHours}h to mastery
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ----- Weekly Calendar ----- */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekly.map((dayPlan) => (
          <DayColumn key={dayPlan.day} dayPlan={dayPlan} topics={topics} />
        ))}
      </div>

      {/* ----- Generate Plan Button ----- */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className={cn(
            "inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition disabled:opacity-50"
          )}
        >
          {generating ? (
            <Loader2 className="animate-spin w-5 h-5 mr-2" />
          ) : (
            <Sparkles className="w-5 h-5 mr-2" />
          )}
          Generate Plan
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </section>
  );
}

/* -------------------- Sub‑Components -------------------- */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
      {icon}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

function DayColumn({
  dayPlan,
  topics,
}: {
  dayPlan: DailyPlan;
  topics: Topic[];
}) {
  const dayColor = "bg-gray-100 dark:bg-gray-700";

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl overflow-hidden shadow-sm",
        dayColor,
        "animate-fade-in-up"
      )}
      style={{ animationDelay: `${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(dayPlan.day) * 100}ms` }}
    >
      <header className="flex items-center justify-between p-2 bg-gray-200 dark:bg-gray-600">
        <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        <span className="font-medium">{dayPlan.day}</span>
      </header>

      {/* Study Blocks */}
      <div className="flex-1 p-2 space-y-2">
        {dayPlan.blocks.map((block) => {
          const topic = topics.find((t) => t.id === block.topicId);
          return (
            <div
              key={block.id}
              className={cn(
                "rounded-md p-2 text-sm font-medium text-gray-800 dark:text-gray-200",
                topic?.color ?? "bg-gray-300"
              )}
            >
              {block.title}
              <span className="block text-xs text-gray-600 dark:text-gray-400">
                {block.duration} min
              </span>
            </div>
          );
        })}
      </div>

      {/* Daily Tasks */}
      <div className="border-t border-gray-300 dark:border-gray-600 p-2">
        {dayPlan.tasks.map((task) => (
          <label
            key={task.id}
            className="flex items-center space-x-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={task.completed}
              readOnly
              className="form-checkbox h-4 w-4 text-emerald-600 rounded"
            />
            <span>{task.title}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Tailwind Animation (optional) -------------------- */
/* Add this to your global CSS if not already present:
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.4s ease-out forwards;
}
*/