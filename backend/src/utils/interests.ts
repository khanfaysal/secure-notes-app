export function parseInterests(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length > 50) {
    return undefined;
  }
  const interests: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      return undefined;
    }
    const interest = item.trim().toLowerCase();
    if (!interest || interest.length > 50) {
      return undefined;
    }
    if (!interests.includes(interest)) {
      interests.push(interest);
    }
  }
  return interests;
}
