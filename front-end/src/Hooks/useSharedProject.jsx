import { useState, useCallback } from 'react';

export const useSharedProject = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  const updateProject = useCallback((updates) => {
    setSelectedProject((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return {
    selectedProject,
    setSelectedProject,
    updateProject,
  };
};
