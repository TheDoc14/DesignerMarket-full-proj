// src/Hooks/useAiQuota.jsx
import { useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const QUOTA_STORAGE_KEY = 'aiQuotaCache';
/*The useAiQuota hook is a specialized React custom hook designed to manage and track the usage limits for AI-powered features
 *(such as the AI Agent in the project popup). It handles data synchronization between the backend API,
 *the component state, and the browser's localStorage to ensure a consistent user experience even after page refreshes.
 */

export const useAiQuota = () => {
  const [aiQuota, setAiQuota] = useState({
    used: 0,
    limit: 20,
    remaining: 20,
  });
  //Synchronizes the local state with the actual usage data stored on the server.
  const fetchAiQuota = useCallback(async () => {
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
  }, []);
  //Retrieves the most recent quota data from localStorage.
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
  //Manually reduces the remaining quota by 1.
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
    const cached = loadQuotaFromStorage();
    if (!cached) {
      fetchAiQuota();
    }
  }, [fetchAiQuota, loadQuotaFromStorage]);

  return {
    aiQuota,
    setAiQuota,
    fetchAiQuota,
    loadQuotaFromStorage,
    decrementQuota,
  };
};
