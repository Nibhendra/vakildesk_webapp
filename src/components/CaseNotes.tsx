import { useState, useEffect } from 'react';

import { StickyNote, Plus, Trash2 } from 'lucide-react';

interface CaseNote {
  id: string;
  text: string;
  createdAt: string;
}

const NOTES_KEY = (caseId: string) => `vakildesk_notes_${caseId}`;

function loadNotes(caseId: string): CaseNote[] {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY(caseId)) || '[]');
  } catch {
    return [];
  }
}

function saveNotes(caseId: string, notes: CaseNote[]) {
  localStorage.setItem(NOTES_KEY(caseId), JSON.stringify(notes));
}

export function CaseNotes({ caseId }: { caseId: string }) {
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setNotes(loadNotes(caseId));
  }, [caseId]);

  const addNote = () => {
    const text = draft.trim();
    if (!text) return;
    const newNote: CaseNote = {
      id: `${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveNotes(caseId, updated);
    setDraft('');
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveNotes(caseId, updated);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote size={15} className="text-purple-400" />
        <h3 className="text-sm font-semibold text-slate-200">Case Notes</h3>
        <span className="ml-auto text-xs text-slate-500">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Add note */}
      <div className="flex gap-2 mb-3">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }}
          placeholder="Add a note... (Enter to save)"
          rows={2}
          className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
        />
        <button
          onClick={addNote}
          disabled={!draft.trim()}
          className="self-end p-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          aria-label="Add note"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Notes list */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-2">No notes yet. Add your first note above.</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="group flex items-start gap-2 bg-slate-900/40 border border-slate-700/40 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 leading-relaxed break-words">{note.text}</p>
                <p className="text-xs text-slate-600 mt-1">{formatTime(note.createdAt)}</p>
              </div>
              <button
                onClick={() => deleteNote(note.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all cursor-pointer"
                aria-label="Delete note"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
