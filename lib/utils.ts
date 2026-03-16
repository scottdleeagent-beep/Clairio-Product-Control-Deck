export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function toDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const timestamp = Number(value);

  if (Number.isFinite(timestamp)) {
    return new Date(timestamp);
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toNullableNumber(value?: string | number | null): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

