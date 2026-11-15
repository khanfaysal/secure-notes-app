import { useCallback, useEffect, useState } from "react";

export function usePagedList(fetchPage) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [items, setItems] = useState([]);
  const [result, setResult] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetchPage(page, limit)
      .then((result) => {
        if (!active) return;
        setResult(result);
        setItems(result.items || []);
        setHasMore(Boolean(result.pagination?.hasMore));
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || "Request failed");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [fetchPage, page, limit, reloadKey]);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);
  const changeLimit = useCallback((value) => {
    setPage(1);
    setLimit(value);
  }, []);

  return { page, limit, items, hasMore, loading, error, result, setPage, changeLimit, reload };
}
