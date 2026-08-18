// Utility functions for authentication

export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("token");
  return !!token;
};

export const getUserRole = (): string | null => {
  if (typeof window === "undefined") return null;

  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;

  try {
    const user = JSON.parse(storedUser);
    return user?.role ?? null;
  } catch {
    return null;
  }
};

export const hasRequiredRole = (requiredRoles: string[]): boolean => {
  const userRole = getUserRole();
  console.log(userRole,'userRole');
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
};

export const logout = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  //   localStorage.removeItem('userData');
  window.location.href = "/";
};

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

// export const setAuthData = (token: string, user: any): void => {
//   if (typeof window === "undefined") return;
//   localStorage.setItem("token", token);
//   // localStorage.setItem('userRole', role);
//   localStorage.setItem("user", JSON.stringify(user));
// };
