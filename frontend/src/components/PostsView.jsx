import { useCallback, useState } from "react";
import { api } from "../api";
import { usePagedList } from "../hooks/usePagedList";
import Pagination from "./Pagination";

function PostList({ posts, loading, error }) {
  if (loading) return <p className="text-sm text-slate-500">Loading posts…</p>;
  if (error) return <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  if (!posts.length) return <p className="rounded border bg-white p-4 text-sm text-slate-500">No posts on this page.</p>;

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <article className="rounded border bg-white p-4" key={post.id}>
          <h2 className="font-medium">{post.title}</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{post.content}</p>
          <p className="mt-2 text-xs text-slate-500">Author ID: {String(post.owner)}</p>
        </article>
      ))}
    </div>
  );
}

function UserPosts({ userId }) {
  const fetchPage = useCallback(async (page, limit) => {
    const result = await api(`/users/${encodeURIComponent(userId)}/posts?page=${page}&limit=${limit}`, { auth: false });
    return { items: result.posts, pagination: result.pagination, user: result.user };
  }, [userId]);
  const posts = usePagedList(fetchPage);

  return (
    <section className="mt-4 space-y-3">
      <h3 className="font-medium">{posts.result?.user?.name ? `Posts by ${posts.result.user.name}` : "User posts"}</h3>
      <PostList posts={posts.items} loading={posts.loading} error={posts.error} />
      <Pagination page={posts.page} limit={posts.limit} hasMore={posts.hasMore} onPageChange={posts.setPage} onLimitChange={posts.changeLimit} />
    </section>
  );
}

export default function PostsView({ user, onNotice }) {
  const fetchPage = useCallback(async (page, limit) => {
    const result = await api(`/posts?page=${page}&limit=${limit}`, { auth: false });
    return { items: result.posts, pagination: result.pagination };
  }, []);
  const posts = usePagedList(fetchPage);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [userIdInput, setUserIdInput] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [busy, setBusy] = useState(false);

  async function createPost(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/posts", { method: "POST", body: draft });
      setDraft({ title: "", content: "" });
      posts.setPage(1);
      posts.reload();
      onNotice("Post published.");
    } catch (error) {
      onNotice(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  function findPosts(event) {
    event.preventDefault();
    const id = userIdInput.trim();
    if (id) setLookupId(id);
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Public posts</h1>
        <p className="text-sm text-slate-600">Posts are visible to everyone.</p>
      </header>

      {user && (
        <form className="grid gap-3 rounded border bg-white p-4" onSubmit={createPost}>
          <h2 className="font-medium">Create post</h2>
          <input maxLength="200" onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Title" required value={draft.title} />
          <textarea maxLength="50000" onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="Content" required rows="3" value={draft.content} />
          <button className="w-fit rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50" disabled={busy}>Publish</button>
        </form>
      )}

      {posts.error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{posts.error}</p>}
      <PostList posts={posts.items} loading={posts.loading} error="" />
      <Pagination page={posts.page} limit={posts.limit} hasMore={posts.hasMore} onPageChange={posts.setPage} onLimitChange={posts.changeLimit} />

      <form className="grid gap-3 rounded border bg-white p-4 sm:grid-cols-[1fr_auto]" onSubmit={findPosts}>
        <label className="text-sm">List posts by user ID
          <input className="mt-1 w-full rounded border p-2" onChange={(event) => setUserIdInput(event.target.value)} placeholder="MongoDB user ID" required value={userIdInput} />
        </label>
        <button className="self-end rounded border px-4 py-2 text-sm">Find posts</button>
      </form>
      {lookupId && <UserPosts key={lookupId} userId={lookupId} />}
    </section>
  );
}
