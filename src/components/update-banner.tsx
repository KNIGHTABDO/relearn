'use client';

import { useState } from 'react';
import { useUpdateChecker } from '@/lib/update-checker';
import { ArrowUpCircle, X, ExternalLink, RefreshCw } from 'lucide-react';

export function UpdateBanner() {
  const { update, checking, dismissed, setDismissed, checkForUpdate } = useUpdateChecker();

  if (dismissed || !update?.available) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up">
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <ArrowUpCircle size={24} className="text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Update Available</p>
            <p className="text-xs text-gray-400 mt-1">
              ReLearn {update.version} is ready to download
            </p>
            <div className="flex items-center gap-2 mt-3">
              <a
                href={update.url}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-medium transition"
              >
                <ExternalLink size={12} />
                Download
              </a>
              <button
                onClick={() => setDismissed(true)}
                className="text-xs text-gray-500 hover:text-gray-300 transition"
              >
                Later
              </button>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="text-gray-600 hover:text-gray-400">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function UpdateCheckButton() {
  const { update, checking, checkForUpdate } = useUpdateChecker();

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Check for Updates</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {update?.available
            ? `${update.version} available!`
            : update
            ? 'You\u2019re on the latest version'
            : 'Check if a newer version is available'}
        </p>
      </div>
      <button
        onClick={checkForUpdate}
        disabled={checking}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-sm font-medium text-gray-700 dark:text-gray-300 transition disabled:opacity-50"
      >
        <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
        {checking ? 'Checking...' : 'Check Now'}
      </button>
    </div>
  );
}
