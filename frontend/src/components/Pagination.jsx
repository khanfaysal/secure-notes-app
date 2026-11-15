const PAGE_SIZES = [10, 20, 50, 100];

export default function Pagination({ page, limit, hasMore, onPageChange, onLimitChange }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
      <button
        className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        Previous
      </button>
      <span>Page {page}</span>
      <button
        className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40"
        disabled={!hasMore}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        Next
      </button>
      <label className="flex items-center gap-2">
        <span>Per page</span>
        <select
          className="rounded border border-slate-300 bg-white px-2 py-1.5"
          onChange={(event) => onLimitChange(Number(event.target.value))}
          value={limit}
        >
          {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
    </div>
  );
}
