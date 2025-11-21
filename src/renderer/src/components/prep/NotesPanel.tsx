import { useState, useEffect } from 'react';
import type { PrepProject, PrepNote, PrepNoteTemplate } from '../../types/prep';

interface NotesPanelProps {
  project: PrepProject;
  onManageTemplates: () => void;
}

export function NotesPanel({ project, onManageTemplates }: NotesPanelProps) {
  const [generalConditions, setGeneralConditions] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [fixtureNotes, setFixtureNotes] = useState('');

  const [generalConditionsId, setGeneralConditionsId] = useState<string | null>(null);
  const [generalNotesId, setGeneralNotesId] = useState<string | null>(null);
  const [fixtureNotesId, setFixtureNotesId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, [project.id]);

  const loadNotes = async () => {
    try {
      const notes = await window.api.prep.notes.getByProjectId(project.id);

      notes.forEach((note: PrepNote) => {
        switch (note.type) {
          case 'general_conditions':
            setGeneralConditions(note.content);
            setGeneralConditionsId(note.id);
            break;
          case 'general_notes':
            setGeneralNotes(note.content);
            setGeneralNotesId(note.id);
            break;
          case 'fixture_notes':
            setFixtureNotes(note.content);
            setFixtureNotesId(note.id);
            break;
        }
      });
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const handleSave = async (
    type: 'general_conditions' | 'general_notes' | 'fixture_notes',
    content: string,
    noteId: string | null
  ) => {
    setIsSaving(true);
    try {
      if (noteId) {
        // Update existing note
        await window.api.prep.notes.update(noteId, content);
      } else {
        // Create new note
        const newNote = await window.api.prep.notes.create({
          prep_project_id: project.id,
          type,
          content,
        });

        // Update the note ID so future edits will update instead of create
        switch (type) {
          case 'general_conditions':
            setGeneralConditionsId(newNote.id);
            break;
          case 'general_notes':
            setGeneralNotesId(newNote.id);
            break;
          case 'fixture_notes':
            setFixtureNotesId(newNote.id);
            break;
        }
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const loadTemplate = async (type: 'general_conditions' | 'general_notes' | 'fixture_notes') => {
    try {
      const template = await window.api.prep.noteTemplates.getDefault(type);
      if (template) {
        const content = template.content;
        switch (type) {
          case 'general_conditions':
            setGeneralConditions(content);
            break;
          case 'general_notes':
            setGeneralNotes(content);
            break;
          case 'fixture_notes':
            setFixtureNotes(content);
            break;
        }
      } else {
        alert('No default template found. Create one in Template Settings.');
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      alert('Failed to load template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Manage Templates button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Add standard language and notes for your shop order
        </p>
        <button
          onClick={onManageTemplates}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
        >
          Manage Templates
        </button>
      </div>

      {/* General Conditions */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white">General Conditions</h3>
          <button
            onClick={() => loadTemplate('general_conditions')}
            className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-xs text-blue-400 transition"
          >
            Load Template
          </button>
        </div>
        <textarea
          value={generalConditions}
          onChange={(e) => setGeneralConditions(e.target.value)}
          onBlur={() => handleSave('general_conditions', generalConditions, generalConditionsId)}
          placeholder="Add general conditions and terms..."
          className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* General Notes */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white">General Notes</h3>
          <button
            onClick={() => loadTemplate('general_notes')}
            className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-xs text-blue-400 transition"
          >
            Load Template
          </button>
        </div>
        <textarea
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          onBlur={() => handleSave('general_notes', generalNotes, generalNotesId)}
          placeholder="Add general project notes..."
          className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Fixture Notes */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white">Fixture Notes</h3>
          <button
            onClick={() => loadTemplate('fixture_notes')}
            className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-xs text-blue-400 transition"
          >
            Load Template
          </button>
        </div>
        <textarea
          value={fixtureNotes}
          onChange={(e) => setFixtureNotes(e.target.value)}
          onBlur={() => handleSave('fixture_notes', fixtureNotes, fixtureNotesId)}
          placeholder="Add notes about fixtures and equipment..."
          className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {isSaving && (
        <div className="text-center text-sm text-gray-400">
          Saving...
        </div>
      )}
    </div>
  );
}
