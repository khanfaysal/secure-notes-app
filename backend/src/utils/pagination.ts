export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(pageValue: unknown, limitValue: unknown): Pagination | undefined {
  const page = parsePositiveInteger(pageValue, 1);
  const limit = parsePositiveInteger(limitValue, 20);
  if (page === undefined || limit === undefined || limit > 100) {
    return undefined;
  }

  const skip = (page - 1) * limit;
  if (!Number.isSafeInteger(skip)) {
    return undefined;
  }
  return { page, limit, skip };
}

function parsePositiveInteger(value: unknown, fallback: number): number | undefined {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}
