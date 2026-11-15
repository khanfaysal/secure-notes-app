import { useCallback, useState } from "react";
import { api } from "../api";
import { usePagedList } from "../hooks/usePagedList";
import Pagination from "./Pagination";

export default function NotesView({ user, onNotice }) {
  const fetchPage = useCallback(async (page, limit) => {
    const result = await api(`/notes?page=${page}&limit=${limit}`);
    return { items: result.notes, pagination: result.pagination };
  }, []);
  const notes = usePagedList(fetchPage);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState(false);

  async function createNote(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/notes", { method: "POST", body: draft });
      setDraft({ title: "", content: "" });
      notes.setPage(1);
      notes.reload();
      onNotice("Note created.");
    } catch (error) {
      onNotice(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function viewNote(id) {
    try {
      const result = await api(`/notes/${encodeURIComponent(id)}`);
      setViewing(result.note);
    } catch (error) {
      onNotice(error.message, true);
    }
  }

  async function saveNote(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api(`/notes/${encodeURIComponent(editing.id)}`, {
        method: "PATCH",
        body: { title: editing.title, content: editing.content },
      });
      setEditing(null);
      notes.reload();
      onNotice("Note updated.");
    } catch (error) {
      onNotice(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function deleteNote(note) {
    if (!window.confirm(`Delete "${note.title}"?`)) return;
    try {
      await api(`/notes/${encodeURIComponent(note.id)}`, { method: "DELETE" });
      notes.reload();
      onNotice("Note deleted.");
    } catch (error) {
      onNotice(error.message, true);
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Notes</h1>
        <p className="text-sm text-slate-600">Create and manage your notes.</p>
      </header>

      <form className="grid gap-3 rounded border bg-white p-4" onSubmit={createNote}>
        <h2 className="font-medium">New note</h2>
        <input
          maxLength="200"
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          placeholder="Title"
          required
          value={draft.title}
        />
        <textarea
          maxLength="50000"
          onChange={(event) => setDraft({ ...draft, content: event.target.value })}
          placeholder="Content"
          required
          rows="3"
          value={draft.content}
        />
        <button className="w-fit rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50" disabled={busy}>
          Create note
        </button>
      </form>

      {notes.error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{notes.error}</p>}
      <div className="space-y-2">
        {notes.loading && <p className="text-sm text-slate-500">Loading notes…</p>}
        {!notes.loading && notes.items.length === 0 && <p className="rounded border bg-white p-4 text-sm text-slate-500">No notes on this page.</p>}
        {notes.items.map((note) => {
          const ownNote = String(note.owner) === String(user.id);
          return (
            <article className="flex flex-wrap items-start justify-between gap-3 rounded border bg-white p-4" key={note.id}>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium">{note.title}</h2>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{note.content}</p>
                {user.role === "admin" && <p className="mt-2 text-xs text-slate-400">Owner: {note.owner}</p>}
              </div>
              <div className="flex gap-2">
                <button className="rounded border px-3 py-1.5 text-sm" onClick={() => viewNote(note.id)} type="button">View</button>
                {ownNote && <>
                  <button className="rounded border px-3 py-1.5 text-sm" onClick={() => setEditing(note)} type="button">Edit</button>
                  <button className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700" onClick={() => deleteNote(note)} type="button">Delete</button>
                </>}
              </div>
            </article>
          );
        })}
      </div>

      <Pagination
        hasMore={notes.hasMore}
        limit={notes.limit}
        onLimitChange={notes.changeLimit}
        onPageChange={notes.setPage}
        page={notes.page}
      />

      {editing && (
        <form className="grid gap-3 rounded border bg-slate-50 p-4" onSubmit={saveNote}>
          <div className="flex justify-between">
            <h2 className="font-medium">Edit note</h2>
            <button className="text-sm text-slate-500" onClick={() => setEditing(null)} type="button">Cancel</button>
          </div>
          <input maxLength="200" onChange={(event) => setEditing({ ...editing, title: event.target.value })} required value={editing.title} />
          <textarea maxLength="50000" onChange={(event) => setEditing({ ...editing, content: event.target.value })} required rows="4" value={editing.content} />
          <button className="w-fit rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50" disabled={busy}>Save changes</button>
        </form>
      )}

      {viewing && (
        <section className="rounded border bg-white p-4" aria-label="Note details">
          <div className="flex justify-between gap-3">
            <h2 className="font-medium">{viewing.title}</h2>
            <button className="text-sm text-slate-500" onClick={() => setViewing(null)} type="button">Close</button>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{viewing.content}</p>
          <p className="mt-2 text-xs text-slate-400">Owner: {String(viewing.owner)}</p>
        </section>
      )}
    </section>
  );
}
