import { useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const QUOTA_STORAGE_KEY = 'aiQuotaCache';

export const useAiQuota = () => {
  const [aiQuota, setAiQuota] = useState({
    used: 0,
    limit: 20,
    remaining: 20,
  });

  // שליפת המכסה מהשרת וחסימתה ב-localStorage
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

        // שמירה ב-localStorage עם timestamp
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

  // טעינת המכסה מ-localStorage אם היא קיימת
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

  // עדכון המכסה כשמשתמש משלח הודעה (הורדה ב-1)
  const decrementQuota = useCallback(() => {
    setAiQuota((prev) => {
      const updated = {
        ...prev,
        used: prev.used + 1,
        remaining: Math.max(0, prev.remaining - 1),
      };

      // שמירה ב-localStorage
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

  // טעינה בעת mount
  useEffect(() => {
    const cached = loadQuotaFromStorage();
    if (!cached) {
      // אם אין cache, שלוף מהשרת
      fetchAiQuota();
    }
  }, []);

  return {
    aiQuota,
    setAiQuota, // ← הוסף

    fetchAiQuota,
    loadQuotaFromStorage,
    decrementQuota,
  };
};
