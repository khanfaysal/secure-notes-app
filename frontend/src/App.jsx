import { useState } from "react";
import { api, clearSavedSession, getSavedSession } from "./api";
import AuthPanel from "./components/AuthPanel";
import InterestGroupsView from "./components/InterestGroupsView";
import NotesView from "./components/NotesView";
import PostsView from "./components/PostsView";
import UsersView from "./components/UsersView";

const initialSession = getSavedSession();

export default function App() {
  const [session, setSession] = useState(initialSession);
  const [view, setView] = useState("posts");
  const [notice, setNotice] = useState(null);
  const [profile, setProfile] = useState(null);

  function showNotice(message, isError = false) {
    setNotice({ message, isError });
  }

  function logout() {
    clearSavedSession();
    setSession(null);
    setProfile(null);
    setView("posts");
    showNotice("Signed out.");
  }

  async function openProfile() {
    try {
      const result = await api(`/users/${encodeURIComponent(session.user.id)}`);
      setProfile(result.user);
    } catch (error) {
      showNotice(error.message, true);
    }
  }

  const tabs = [
    { id: "posts", label: "Posts", visible: true },
    { id: "notes", label: "Notes", visible: Boolean(session) },
    { id: "users", label: "Users", visible: session?.user.role === "admin" },
    { id: "groups", label: "Interest groups", visible: session?.user.role === "admin" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <h1 className="font-semibold">Secure Notes</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {session ? (
            <div className="flex items-center gap-2 text-sm">
              <span>{session.user.name} ({session.user.role})</span>
              <button className="rounded border bg-white px-3 py-1.5" onClick={openProfile} type="button">Profile</button>
              <button className="rounded border bg-white px-3 py-1.5" onClick={logout} type="button">Sign out</button>
            </div>
          ) : <span />}
        </div>

        {notice && (
          <div className={`flex items-start justify-between gap-3 rounded border p-3 text-sm ${notice.isError ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700"}`} role={notice.isError ? "alert" : "status"}>
            <span>{notice.message}</span>
            <button aria-label="Dismiss" className="text-slate-500" onClick={() => setNotice(null)} type="button">×</button>
          </div>
        )}

        {!session && <AuthPanel onAuthenticated={(value) => {
          setSession(value);
          setView("notes");
        }} onNotice={showNotice} />}

        <nav className="flex flex-wrap gap-2 border-b pb-3" aria-label="API sections">
          {tabs.filter((tab) => tab.visible).map((tab) => (
            <button
              aria-current={view === tab.id ? "page" : undefined}
              className={`rounded px-3 py-2 text-sm ${view === tab.id ? "bg-slate-900 text-white" : "border bg-white text-slate-700"}`}
              key={tab.id}
              onClick={() => {
                setView(tab.id);
                setNotice(null);
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {view === "posts" && <PostsView user={session?.user} onNotice={showNotice} />}
        {view === "notes" && session && <NotesView user={session.user} onNotice={showNotice} />}
        {view === "users" && session?.user.role === "admin" && <UsersView currentUser={session.user} onNotice={showNotice} />}
        {view === "groups" && session?.user.role === "admin" && <InterestGroupsView />}
      </main>

      {profile && (
        <div className="fixed inset-0 z-10 grid place-items-center bg-black/30 p-4" role="presentation" onClick={() => setProfile(null)}>
          <section aria-labelledby="profile-title" aria-modal="true" className="w-full max-w-md space-y-2 rounded border bg-white p-5 shadow-lg" role="dialog" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold" id="profile-title">User profile</h2>
              <button aria-label="Close profile" className="text-xl text-slate-500" onClick={() => setProfile(null)} type="button">×</button>
            </div>
            <p className="text-sm">{profile.name} · {profile.role}</p>
            <p className="text-sm text-slate-600">{profile.email}</p>
            <p className="text-sm text-slate-600">Interests: {(profile.interests || []).join(", ") || "None"}</p>
          </section>
        </div>
      )}
    </div>
  );
}
