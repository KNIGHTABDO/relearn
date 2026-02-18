'use client';

import { useEffect, useState } from 'react';

const GITHUB_OWNER = 'KNIGHTABDO';
const GITHUB_REPO = 'relearn';
const CURRENT_VERSION = '0.1.0';

interface UpdateInfo {
  available: boolean;
  version: string;
  url: string;
  body: string;
}

export function useUpdateChecker() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkForUpdate = async () => {
    setChecking(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`);
      const data = await res.json();
      if (data.tag_name) {
        const latest = data.tag_name.replace(/^v/, '');
        if (latest !== CURRENT_VERSION && latest > CURRENT_VERSION) {
          setUpdate({
            available: true,
            version: data.tag_name,
            url: data.html_url,
            body: data.body || '',
          });
        } else {
          setUpdate({ available: false, version: data.tag_name, url: '', body: '' });
        }
      }
    } catch {
      // Silently fail — no internet or rate limited
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Auto-check on mount
    const lastCheck = localStorage.getItem('relearn-last-update-check');
    const now = Date.now();
    // Check at most once per hour
    if (!lastCheck || now - parseInt(lastCheck) > 3600000) {
      checkForUpdate();
      localStorage.setItem('relearn-last-update-check', now.toString());
    }
  }, []);

  return { update, checking, dismissed, setDismissed, checkForUpdate };
}
