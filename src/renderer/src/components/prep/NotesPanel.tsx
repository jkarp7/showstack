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

  const [generalConditionsFormat, setGeneralConditionsFormat] = useState<'plain' | 'bullets' | 'numbered'>('plain');
  const [generalNotesFormat, setGeneralNotesFormat] = useState<'plain' | 'bullets' | 'numbered'>('plain');
  const [fixtureNotesFormat, setFixtureNotesFormat] = useState<'plain' | 'bullets' | 'numbered'>('plain');

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
            setGeneralConditionsFormat(note.format || 'plain');
            break;
          case 'general_notes':
            setGeneralNotes(note.content);
            setGeneralNotesId(note.id);
            setGeneralNotesFormat(note.format || 'plain');
            break;
          case 'fixture_notes':
            setFixtureNotes(note.content);
            setFixtureNotesId(note.id);
            setFixtureNotesFormat(note.format || 'plain');
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
    format: 'plain' | 'bullets' | 'numbered',
    noteId: string | null
  ) => {
    setIsSaving(true);
    try {
      if (noteId) {
        // Update existing note
        await window.api.prep.notes.update(noteId, { content, format });
      } else {
        // Create new note
        const newNote = await window.api.prep.notes.create({
          prep_project_id: project.id,
          type,
          content,
          format,
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
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add standard language and notes for your shop order
        </p>
        <button
          onClick={onManageTemplates}
          className="px-3 py-1.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded text-sm transition"
        >
          Manage Templates
        </button>
      </div>

      {/* General Conditions */}
      <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">General Conditions</h3>
          <div className="flex items-center gap-2">
            <select
              value={generalConditionsFormat}
              onChange={(e) => {
                const newFormat = e.target.value as 'plain' | 'bullets' | 'numbered';
                setGeneralConditionsFormat(newFormat);
                handleSave('general_conditions', generalConditions, newFormat, generalConditionsId);
              }}
              className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white"
            >
              <option value="plain">Plain Text</option>
              <option value="bullets">Bullets</option>
              <option value="numbered">Numbered</option>
            </select>
            <button
              onClick={() => loadTemplate('general_conditions')}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-600/20 hover:bg-blue-200 dark:hover:bg-blue-600/30 rounded text-xs text-blue-600 dark:text-blue-400 transition"
            >
              Load Template
            </button>
          </div>
        </div>
        <textarea
          value={generalConditions}
          onChange={(e) => setGeneralConditions(e.target.value)}
          onBlur={() => handleSave('general_conditions', generalConditions, generalConditionsFormat, generalConditionsId)}
          placeholder="Add general conditions and terms..."
          className="w-full h-32 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* General Notes */}
      <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">General Notes</h3>
          <div className="flex items-center gap-2">
            <select
              value={generalNotesFormat}
              onChange={(e) => {
                const newFormat = e.target.value as 'plain' | 'bullets' | 'numbered';
                setGeneralNotesFormat(newFormat);
                handleSave('general_notes', generalNotes, newFormat, generalNotesId);
              }}
              className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white"
            >
              <option value="plain">Plain Text</option>
              <option value="bullets">Bullets</option>
              <option value="numbered">Numbered</option>
            </select>
            <button
              onClick={() => loadTemplate('general_notes')}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-600/20 hover:bg-blue-200 dark:hover:bg-blue-600/30 rounded text-xs text-blue-600 dark:text-blue-400 transition"
            >
              Load Template
            </button>
          </div>
        </div>
        <textarea
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          onBlur={() => handleSave('general_notes', generalNotes, generalNotesFormat, generalNotesId)}
          placeholder="Add general project notes..."
          className="w-full h-32 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Fixture Notes */}
      <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Fixture Notes</h3>
          <div className="flex items-center gap-2">
            <select
              value={fixtureNotesFormat}
              onChange={(e) => {
                const newFormat = e.target.value as 'plain' | 'bullets' | 'numbered';
                setFixtureNotesFormat(newFormat);
                handleSave('fixture_notes', fixtureNotes, newFormat, fixtureNotesId);
              }}
              className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white"
            >
              <option value="plain">Plain Text</option>
              <option value="bullets">Bullets</option>
              <option value="numbered">Numbered</option>
            </select>
            <button
              onClick={() => loadTemplate('fixture_notes')}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-600/20 hover:bg-blue-200 dark:hover:bg-blue-600/30 rounded text-xs text-blue-600 dark:text-blue-400 transition"
            >
              Load Template
            </button>
          </div>
        </div>
        <textarea
          value={fixtureNotes}
          onChange={(e) => setFixtureNotes(e.target.value)}
          onBlur={() => handleSave('fixture_notes', fixtureNotes, fixtureNotesFormat, fixtureNotesId)}
          placeholder="Add notes about fixtures and equipment..."
          className="w-full h-32 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {isSaving && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Saving...
        </div>
      )}
    </div>
  );
}
