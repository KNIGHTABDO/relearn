'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Image,
  Sparkles,
  Loader2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Download,
  ChevronRight,
} from 'lucide-react';
import cn from '@/lib/utils';

type Branch = {
  label: string;
  color: string;
  leaves: string[];
};

type InfographicData = {
  central: { label: string; color: string };
  branches: Branch[];
};

type TooltipInfo = {
  x: number;
  y: number;
  content: string;
};

const MOCK_DATA: InfographicData = {
  central: { label: 'Cell Biology', color: '#A855F7' },
  branches: [
    {
      label: 'Cell Structure',
      color: '#3B82F6',
      leaves: ['Membrane', 'Nucleus', 'Cytoplasm'],
    },
    {
      label: 'Cell Division',
      color: '#10B981',
      leaves: ['Mitosis', 'Meiosis', 'Cytokinesis'],
    },
    {
      label: 'Genetics',
      color: '#F59E0B',
      leaves: ['DNA', 'RNA', 'Proteins'],
    },
    {
      label: 'Metabolism',
      color: '#EF4444',
      leaves: ['Glycolysis', 'Krebs Cycle', 'Oxidative Phos'],
    },
  ],
};

export default function InfographicViewer() {
  const [data, setData] = useState<InfographicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [zoom, setZoom] = useState(1);

  // -------------------------------------------------------------------------
  // Fetch data (fallback to mock when request fails or no auth token)
  // -------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'infographic' }),
      });
      if (!res.ok) throw new Error('Network error');
      const json = (await res.json()) as InfographicData;
      setData(json);
    } catch {
      // use mock data on any error (including missing token)
      setData(MOCK_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initial load – do not auto‑fetch, wait for user action
  }, []);

  // -------------------------------------------------------------------------
  // UI helpers
  // -------------------------------------------------------------------------
  const startGeneration = () => fetchData();

  const regenerate = () => fetchData();

  const exportAsImage = () => {
    // placeholder – real implementation would use html2canvas
    console.log('Export as image (placeholder)');
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------
  const renderSkeleton = () => (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Creating your visual summary...
      </p>
      <svg className="w-64 h-64 animate-pulse" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="30" fill="#e5e7eb" />
        {[...Array(4)].map((_, i) => {
          const angle = (i * Math.PI) / 2;
          const x = 100 + Math.cos(angle) * 80;
          const y = 100 + Math.sin(angle) * 80;
          return (
            <g key={i}>
              <line
                x1="100"
                y1="100"
                x2={x}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="4"
              />
              <circle cx={x} cy={y} r="15" fill="#e5e7eb" />
            </g>
          );
        })}
      </svg>
    </div>
  );

  const renderPreGeneration = () => (
    <div className="flex flex-col items-center justify-center h-screen space-y-2">
      <button
        onClick={startGeneration}
        className={cn(
          'flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm',
          'border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500',
          'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700'
        )}
      >
        <Image className="w-4 h-4 mr-2" />
        <Sparkles className="w-4 h-4 mr-2" />
        Generate Visual Summary
      </button>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Turn your notes into a visual mind map
      </p>
    </div>
  );

  const renderInfographic = () => {
    if (!data) return null;

    const centerX = 50;
    const centerY = 50;
    const radius = 30; // central node radius (percent of viewBox)
    const branchRadius = 12;
    const leafRadius = 8;
    const branchDist = 30; // distance from center to branch nodes
    const leafDist = 20; // distance from branch to leaf

    // Helper to compute polar coordinates
    const polar = (angleDeg: number, dist: number) => {
      const rad = (angleDeg * Math.PI) / 180;
      return {
        x: centerX + Math.cos(rad) * dist,
        y: centerY + Math.sin(rad) * dist,
      };
    };

    return (
      <div className="relative flex-1 overflow-hidden">
        {/* Zoom wrapper */}
        <div
          className="w-full h-full origin-center transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* SVG connections */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Central node */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill={data.central.color}
            />
            {/* Branch connections */}
            {data.branches.map((branch, i) => {
              const angle = (i * 360) / data.branches.length - 90;
              const branchPos = polar(angle, branchDist);
              // curved line (quadratic bezier) from center to branch
              const ctrl = polar(angle, branchDist / 2);
              return (
                <g key={i}>
                  <path
                    d={`
                      M ${centerX} ${centerY}
                      Q ${ctrl.x} ${ctrl.y} ${branchPos.x} ${branchPos.y}
                    `}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="stroke-gray-400 dark:stroke-gray-500"
                    strokeDasharray="2 2"
                  />
                  {/* Leaves connections */}
                  {branch.leaves.map((leaf, li) => {
                    const leafAngle = angle + (li - 1) * 15;
                    const leafPos = polar(leafAngle, branchDist + leafDist);
                    const leafCtrl = polar(leafAngle, branchDist + leafDist / 2);
                    return (
                      <path
                        key={li}
                        d={`
                          M ${branchPos.x} ${branchPos.y}
                          Q ${leafCtrl.x} ${leafCtrl.y} ${leafPos.x} ${leafPos.y}
                        `}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="stroke-gray-300 dark:stroke-gray-600"
                        strokeDasharray="2 2"
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* HTML nodes positioned over SVG */}
          {/* Central node */}
          <div
            className={cn(
              'absolute flex items-center justify-center rounded-full shadow-md cursor-pointer',
              'text-white font-medium select-none',
              'transition-transform duration-300 ease-out',
              'animate-[scaleIn_0.5s_ease-out_forwards]'
            )}
            style={{
              left: `${centerX}%`,
              top: `${centerY}%`,
              width: `${radius * 2}%`,
              height: `${radius * 2}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: data.central.color,
            }}
            onClick={() =>
              setTooltip({
                x: centerX,
                y: centerY,
                content: data.central.label,
              })
            }
          >
            {data.central.label}
          </div>

          {/* Branch nodes */}
          {data.branches.map((branch, i) => {
            const angle = (i * 360) / data.branches.length - 90;
            const pos = polar(angle, branchDist);
            return (
              <div
                key={i}
                className={cn(
                  'absolute flex items-center justify-center rounded-xl shadow-md cursor-pointer',
                  'text-white font-medium select-none',
                  'transition-transform duration-300 ease-out',
                  'animate-[scaleIn_0.5s_ease-out_forwards]'
                )}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: `${branchRadius * 2}%`,
                  height: `${branchRadius * 2}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: branch.color,
                }}
                onClick={() =>
                  setTooltip({
                    x: pos.x,
                    y: pos.y,
                    content: branch.label,
                  })
                }
              >
                {branch.label}
              </div>
            );
          })}

          {/* Leaf nodes */}
          {data.branches.map((branch, i) => {
            const angle = (i * 360) / data.branches.length - 90;
            const branchPos = polar(angle, branchDist);
            return branch.leaves.map((leaf, li) => {
              const leafAngle = angle + (li - 1) * 15;
              const leafPos = polar(leafAngle, branchDist + leafDist);
              return (
                <div
                  key={`${i}-${li}`}
                  className={cn(
                    'absolute flex items-center justify-center rounded-full shadow-sm cursor-pointer',
                    'text-gray-800 dark:text-gray-200 font-medium select-none',
                    'bg-white dark:bg-gray-700',
                    'transition-transform duration-300 ease-out',
                    'animate-[scaleIn_0.5s_ease-out_forwards]'
                  )}
                  style={{
                    left: `${leafPos.x}%`,
                    top: `${leafPos.y}%`,
                    width: `${leafRadius * 2}%`,
                    height: `${leafRadius * 2}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() =>
                    setTooltip({
                      x: leafPos.x,
                      y: leafPos.y,
                      content: leaf,
                    })
                  }
                >
                  {leaf}
                </div>
              );
            });
          })}

          {/* Tooltip */}
          {tooltip && (
            <div
              className={cn(
                'absolute z-10 max-w-xs rounded-md bg-white p-2 text-sm shadow-lg',
                'dark:bg-gray-800 dark:text-gray-100'
              )}
              style={{
                left: `${tooltip.x}%`,
                top: `${tooltip.y}%`,
                transform: 'translate(-50%, -120%)',
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              {tooltip.content}
            </div>
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          <button
            onClick={handleZoomIn}
            className={cn(
              'flex items-center rounded-md bg-white p-2 shadow-sm hover:bg-gray-50',
              'dark:bg-gray-800 dark:hover:bg-gray-700'
            )}
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className={cn(
              'flex items-center rounded-md bg-white p-2 shadow-sm hover:bg-gray-50',
              'dark:bg-gray-800 dark:hover:bg-gray-700'
            )}
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={regenerate}
            className={cn(
              'flex items-center rounded-md bg-white p-2 shadow-sm hover:bg-gray-50',
              'dark:bg-gray-800 dark:hover:bg-gray-700'
            )}
          >
            <RefreshCw className="w-5 h-5 mr-1" />
            Regenerate
          </button>
          <button
            onClick={exportAsImage}
            className={cn(
              'flex items-center rounded-md bg-white p-2 shadow-sm hover:bg-gray-50',
              'dark:bg-gray-800 dark:hover:bg-gray-700'
            )}
          >
            <Download className="w-5 h-5 mr-1" />
            Export as Image
          </button>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------
  if (loading) return renderSkeleton();
  if (!data) return renderPreGeneration();
  return renderInfographic();
}
