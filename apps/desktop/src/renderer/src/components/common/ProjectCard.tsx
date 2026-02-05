import { Project } from '../store/projectStore';
import { useState, useEffect } from 'react';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, onClick, onDelete }: ProjectCardProps) {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  // Load logo as data URL
  useEffect(() => {
    const loadLogo = async () => {
      if (!project.logo_path) {
        setLogoDataUrl(null);
        return;
      }

      // If already a data URL or http(s) URL, use as-is
      if (
        project.logo_path.startsWith('data:') ||
        project.logo_path.startsWith('http://') ||
        project.logo_path.startsWith('https://')
      ) {
        setLogoDataUrl(project.logo_path);
        return;
      }

      // Read file as data URL
      try {
        if (typeof window !== 'undefined' && window.api?.files) {
          const dataUrl = await window.api.files.readImageAsDataUrl(project.logo_path);
          setLogoDataUrl(dataUrl);
        }
      } catch (error) {
        console.error('[ProjectCard] Error loading logo:', error);
        setLogoDataUrl(null);
      }
    };

    loadLogo();
  }, [project.logo_path]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <button
      onClick={onClick}
      className="relative p-6 rounded-lg border-2 border-gray-700 bg-gray-800 hover:border-blue-500 hover:bg-gray-700 transition-all text-left group"
    >
      {/* Delete button (appears on hover) */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-600 hover:bg-red-700 text-gray-900 dark:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Delete project"
      >
        ×
      </button>
      {/* Project Logo/Preview */}
      <div className="mb-4 flex items-center justify-center h-32 bg-gray-700 rounded-lg group-hover:bg-gray-650 transition overflow-hidden p-2">
        {logoDataUrl ? (
          <img
            src={logoDataUrl}
            alt={`${project.name} logo`}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <span className="text-4xl">📁</span>
        )}
      </div>

      {/* Project Info */}
      <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white truncate">{project.name}</h3>

      {project.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{project.description}</p>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Last modified</span>
        <span>{formatDate(project.updated_at)}</span>
      </div>
    </button>
  );
}
