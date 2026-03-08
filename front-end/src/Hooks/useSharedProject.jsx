// src/Hooks/useSharedProject.jsx
import { useState, useCallback } from 'react';

/*
 *The useSharedProject hook is a lightweight state management utility designed to handle the data of a single active project across the application.
 *It is primarily used to synchronize project data between a listing view (like a gallery or catalog) and a detailed view (like the Popup component)
 */
export const useSharedProject = () => {
  //Holds the full project object. When this state is populated, it usually triggers the opening of a modal or a detailed view. When set to null, the detail view is typically closed.
  const [selectedProject, setSelectedProject] = useState(null);

  //Performs a shallow merge on the currently selected project.
  const updateProject = useCallback((updates) => {
    setSelectedProject((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return {
    selectedProject,
    setSelectedProject,
    updateProject,
  };
};
