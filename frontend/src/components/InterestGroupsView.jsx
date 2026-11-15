import { useCallback } from "react";
import { api } from "../api";
import { usePagedList } from "../hooks/usePagedList";
import Pagination from "./Pagination";

export default function InterestGroupsView() {
  const fetchPage = useCallback(async (page, limit) => {
    const result = await api(`/users/interest-groups?page=${page}&limit=${limit}`);
    return { items: result.groups, pagination: result.pagination };
  }, []);
  const groups = usePagedList(fetchPage);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Interest groups</h1>
        <p className="text-sm text-slate-600">Users grouped by their interests.</p>
      </header>
      {groups.error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{groups.error}</p>}
      {groups.loading && <p className="text-sm text-slate-500">Loading groups…</p>}
      {!groups.loading && groups.items.length === 0 && <p className="rounded border bg-white p-4 text-sm text-slate-500">No groups found. Add interests to user profiles.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {groups.items.map((group) => (
          <article className="rounded border bg-white p-4" key={group.interest}>
            <h2 className="font-medium">{group.interest} <span className="text-sm font-normal text-slate-500">({group.users.length})</span></h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {group.users.map((member) => <li key={member.id}>{member.name} <span className="text-slate-400">· {member.email}</span></li>)}
            </ul>
          </article>
        ))}
      </div>
      <Pagination page={groups.page} limit={groups.limit} hasMore={groups.hasMore} onPageChange={groups.setPage} onLimitChange={groups.changeLimit} />
    </section>
  );
}
