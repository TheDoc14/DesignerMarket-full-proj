// src/Hooks/useAiQuota.jsx
import { useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const QUOTA_STORAGE_KEY = 'aiQuotaCache';
/*
 * This custom hook manages the client-side state of the AI usage quota.
 * It synchronizes quota information between the backend API, React state,
 * and localStorage so the user can see remaining AI usage even after refresh.
 * The backend still remains the source of truth for quota enforcement.
 */
export const useAiQuota = ({ enabled = true } = {}) => {
  const [aiQuota, setAiQuota] = useState({
    used: 0,
    limit: 20,
    remaining: 20,
  });

  // Fetch the latest quota metadata from the backend and update the local cache.
  // This keeps the user interface aligned with the real server-side usage counters.
  const fetchAiQuota = useCallback(async () => {
    if (!enabled) return null;
    try {
      const res = await api.get('/api/ai-chats');
      const meta = res.data?.meta;

      if (meta) {
        const used = Number(meta.quota?.used || meta.used || meta.total || 0);
        const limit = Number(meta.quota?.limit || meta.limit || 20);
        const remaining =
          typeof meta.quota?.remaining !== 'undefined'
            ? Number(meta.quota.remaining)
            : Math.max(0, limit - used);

        const newQuota = { used, limit, remaining };
        setAiQuota(newQuota);
        localStorage.setItem(
          QUOTA_STORAGE_KEY,
          JSON.stringify({
            quota: newQuota,
            timestamp: Date.now(),
          })
        );

        return newQuota;
      }
    } catch (err) {
      console.error('Failed to fetch quota:', err);
      return null;
    }
  }, [enabled]);

  // Restore the most recent known quota snapshot from localStorage
  // to improve responsiveness before the next server synchronization.
  const loadQuotaFromStorage = useCallback(() => {
    try {
      const cached = localStorage.getItem(QUOTA_STORAGE_KEY);
      if (cached) {
        const { quota } = JSON.parse(cached);
        setAiQuota(quota);
        return quota;
      }
    } catch (err) {
      console.error('Failed to load quota from storage:', err);
    }
    return null;
  }, []);

  // Optimistically decrease the local remaining quota after a successful AI request.
  // This improves UX, while the backend still performs the actual quota validation.
  const decrementQuota = useCallback(() => {
    setAiQuota((prev) => {
      const updated = {
        ...prev,
        used: prev.used + 1,
        remaining: Math.max(0, prev.remaining - 1),
      };
      localStorage.setItem(
        QUOTA_STORAGE_KEY,
        JSON.stringify({
          quota: updated,
          timestamp: Date.now(),
        })
      );

      return updated;
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const cached = loadQuotaFromStorage();
    if (!cached) {
      fetchAiQuota();
    }
  }, [enabled, fetchAiQuota, loadQuotaFromStorage]);

  return {
    aiQuota,
    setAiQuota,
    fetchAiQuota,
    loadQuotaFromStorage,
    decrementQuota,
  };
};
