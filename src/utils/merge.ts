import axios from "axios";
import type { QueryClient } from "@tanstack/react-query";

// Data that changes owner when a guest's things move into their account
const MERGED_QUERY_KEYS = [
  ["cart"],
  ["cartCount"],
  ["orders"],
  ["guest-orders"],
  ["recently-viewed-products"],
];

/**
 * Call right after a sign-in or sign-up succeeds. Moves this browser's guest
 * orders, cart and recently-viewed products into the account
 * (PATCH /auth/merge-user), then forgets the visitorId so the guest identity
 * isn't reused.
 *
 * The visitorId is only dropped once the server confirms: if the merge fails
 * it's kept, so the next sign-in retries instead of the guest's cart and
 * orders being orphaned. Never throws — signing in must not fail because of
 * this. Resolves to whether there's nothing left to merge.
 */
export const mergeGuestUserWithRealUser = async (
  token: string,
  queryClient?: QueryClient,
): Promise<boolean> => {
  let visitorId: string | null = null;
  try {
    visitorId = localStorage.getItem("visitorId");
  } catch {
    return true; // storage blocked: nothing persisted to merge
  }
  if (!visitorId) return true;

  try {
    await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/auth/merge-user`, null, {
      params: { visitorId },
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
      timeout: 15000,
    });
  } catch {
    return false;
  }

  try {
    localStorage.removeItem("visitorId");
  } catch {
    /* blocked storage: nothing to remove */
  }

  // Queries that already refetched for the new token may have run before
  // the merge landed; refresh them now that the guest's data is in place.
  // Not awaited: the refetches update the page in the background, and the
  // sign-in flow shouldn't wait on the slowest of them.
  for (const queryKey of MERGED_QUERY_KEYS) {
    void queryClient?.invalidateQueries({ queryKey });
  }
  return true;
};
