"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";

type PermissionsState = {
  role: string | null;
  actions: string[];
  loading: boolean;
  error: boolean;
};

const PermissionsContext = createContext<PermissionsState | null>(null);

export const PermissionsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, token } = useAuth();
  const axiosSecure = useAxiosSecure();
  const [state, setState] = useState<PermissionsState>({
    role: null,
    actions: [],
    loading: true,
    error: false,
  });

  const fetchMine = useCallback(async () => {
    if (!user || !token) {
      setState({ role: null, actions: [], loading: false, error: false });
      return;
    }
    try {
      const { data } = await axiosSecure.get("/permissions/mine");
      setState({
        role: data.role,
        actions: data.actions ?? [],
        loading: false,
        error: false,
      });
    } catch {
      // Fail OPEN, not closed — see useHasPermission() below. A network
      // hiccup here must never hide nav items the user could see before.
      setState((prev) => ({ ...prev, loading: false, error: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  return (
    <PermissionsContext.Provider value={state}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions must be used inside PermissionsProvider");
  }
  return ctx;
};

/**
 * true if: SUPERADMIN, OR any of `action` is in the user's granted actions,
 * OR permissions are still loading / failed to load (fail-open — worst case
 * is identical to today's "show everything" behavior, never a broken UI).
 */
export const useHasPermission = (action: string | string[]) => {
  const { role, actions, loading, error } = usePermissions();
  if (loading || error) return true;
  if (role === "SUPERADMIN") return true;
  const required = Array.isArray(action) ? action : [action];
  return required.some((a) => actions.includes(a));
};
