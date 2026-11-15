import { useCallback, useState } from "react";
import { api } from "../api";
import { usePagedList } from "../hooks/usePagedList";
import Pagination from "./Pagination";

const emptyDraft = {
  name: "",
  email: "",
  password: "",
  role: "user",
  interests: "",
};

const toInterests = (value) => value.split(",").map((interest) => interest.trim()).filter(Boolean);

export default function UsersView({ currentUser, onNotice }) {
  const fetchPage = useCallback(async (page, limit) => {
    const result = await api(`/users?page=${page}&limit=${limit}`);
    return { items: result.users, pagination: result.pagination };
  }, []);
  const users = usePagedList(fetchPage);
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState(null);
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(false);

  async function createUser(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/users", {
        method: "POST",
        body: { ...draft, interests: toInterests(draft.interests) },
      });
      setDraft(emptyDraft);
      users.setPage(1);
      users.reload();
      onNotice("User created.");
    } catch (error) {
      onNotice(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function openProfile(id) {
    try {
      const result = await api(`/users/${encodeURIComponent(id)}`);
      setProfile(result.user);
    } catch (error) {
      onNotice(error.message, true);
    }
  }

  async function saveUser(event) {
    event.preventDefault();
    const body = {
      name: editing.name,
      email: editing.email,
      role: editing.role,
      interests: toInterests(editing.interests),
    };
    if (editing.password) body.password = editing.password;

    setBusy(true);
    try {
      await api(`/users/${encodeURIComponent(editing.id)}`, { method: "PATCH", body });
      setEditing(null);
      users.reload();
      onNotice("User updated.");
    } catch (error) {
      onNotice(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(user) {
    if (!window.confirm(`Delete ${user.name}, their notes, and their posts?`)) return;
    try {
      await api(`/users/${encodeURIComponent(user.id)}`, { method: "DELETE" });
      users.reload();
      onNotice("User deleted.");
    } catch (error) {
      onNotice(error.message, true);
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-slate-600">Admin user management and profile interests.</p>
      </header>

      <form className="grid gap-3 rounded border bg-white p-4 md:grid-cols-2" onSubmit={createUser}>
        <h2 className="font-medium md:col-span-2">Add user</h2>
        <input maxLength="100" onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Name" required value={draft.name} />
        <input onChange={(event) => setDraft({ ...draft, email: event.target.value })} placeholder="Email" required type="email" value={draft.email} />
        <input maxLength="72" minLength="8" onChange={(event) => setDraft({ ...draft, password: event.target.value })} placeholder="Temporary password" required type="password" value={draft.password} />
        <select onChange={(event) => setDraft({ ...draft, role: event.target.value })} value={draft.role}>
          <option value="user">User</option><option value="admin">Admin</option>
        </select>
        <input className="md:col-span-2" onChange={(event) => setDraft({ ...draft, interests: event.target.value })} placeholder="Interests, comma-separated" value={draft.interests} />
        <button className="w-fit rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50 md:col-span-2" disabled={busy}>Add user</button>
      </form>

      {users.error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{users.error}</p>}

      {editing && (
        <form className="grid gap-3 rounded border bg-slate-50 p-4 md:grid-cols-2" onSubmit={saveUser}>
          <div className="flex justify-between md:col-span-2">
            <h2 className="font-medium">Edit {editing.name}</h2>
            <button className="text-sm text-slate-500" onClick={() => setEditing(null)} type="button">Cancel</button>
          </div>
          <input maxLength="100" onChange={(event) => setEditing({ ...editing, name: event.target.value })} required value={editing.name} />
          <input onChange={(event) => setEditing({ ...editing, email: event.target.value })} required type="email" value={editing.email} />
          <select onChange={(event) => setEditing({ ...editing, role: event.target.value })} value={editing.role}>
            <option value="user">User</option><option value="admin">Admin</option>
          </select>
          <input onChange={(event) => setEditing({ ...editing, interests: event.target.value })} placeholder="Interests, comma-separated" value={editing.interests} />
          <input className="md:col-span-2" maxLength="72" minLength="8" onChange={(event) => setEditing({ ...editing, password: event.target.value })} placeholder="New password (optional)" type="password" value={editing.password} />
          <button className="w-fit rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50 md:col-span-2" disabled={busy}>Save user</button>
        </form>
      )}

      <div className="space-y-2">
        {users.loading && <p className="text-sm text-slate-500">Loading users…</p>}
        {!users.loading && users.items.length === 0 && <p className="rounded border bg-white p-4 text-sm text-slate-500">No users on this page.</p>}
        {users.items.map((user) => (
          <article className="flex flex-wrap items-start justify-between gap-3 rounded border bg-white p-4" key={user.id}>
            <div>
              <h2 className="font-medium">{user.name} <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{user.role}</span></h2>
              <p className="text-sm text-slate-600">{user.email}</p>
              <p className="mt-1 text-xs text-slate-500">{(user.interests || []).join(", ") || "No interests"}</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded border px-3 py-1.5 text-sm" onClick={() => openProfile(user.id)} type="button">Profile</button>
              <button className="rounded border px-3 py-1.5 text-sm" onClick={() => setEditing({
                ...user,
                interests: (user.interests || []).join(", "),
                password: "",
              })} type="button">Edit</button>
              {String(user.id) !== String(currentUser.id) && (
                <button className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700" onClick={() => deleteUser(user)} type="button">Delete</button>
              )}
            </div>
          </article>
        ))}
      </div>

      <Pagination page={users.page} limit={users.limit} hasMore={users.hasMore} onPageChange={users.setPage} onLimitChange={users.changeLimit} />

      {profile && (
        <section className="rounded border bg-white p-4">
          <div className="flex justify-between">
            <h2 className="font-medium">Profile: {profile.name}</h2>
            <button className="text-sm text-slate-500" onClick={() => setProfile(null)} type="button">Close</button>
          </div>
          <p className="text-sm text-slate-600">{profile.email} · {profile.role}</p>
          <p className="mt-1 text-sm">Interests: {(profile.interests || []).join(", ") || "None"}</p>
        </section>
      )}
    </section>
  );
}
