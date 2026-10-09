"use server";

import { revalidatePath } from "next/cache";

// Public CMS pages are ISR-cached for an hour; the admin editors call this
// after a successful save so edits show up immediately. Only allowlisted paths
// can be revalidated, and revalidating just marks the page stale — the worst
// an anonymous caller can do is make the next visitor trigger one rebuild.
const REVALIDATABLE = ["/terms-and-conditions", "/privacy-policy"] as const;

export type RevalidatableCmsPath = (typeof REVALIDATABLE)[number];

export async function revalidateCmsPage(path: RevalidatableCmsPath) {
  if (!REVALIDATABLE.includes(path)) return;
  revalidatePath(path);
}
