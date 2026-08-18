/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getCustomerInfo } from "@/utils/customer";

type User = {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  role:
    | "CUSTOMER"
    | "SUPPORT"
    | "ORDERMANAGER"
    | "PRODUCTMANAGER"
    | "INVENTORYMANAGER"
    | "SUPERADMIN";
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (data: { token: string; user: User }) => void;
  logout: () => void;
  loading: boolean;
  setUser: Dispatch<SetStateAction<User | null>>;
  setToken: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const customerInfo = async () => {
    return await getCustomerInfo();
  };

  useEffect(() => {
    const userInfo = customerInfo();
    // console.log(userInfo, "userInfo");

    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      // console.log(storedToken,'storedToken');
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  // loading && <LoadingDots></LoadingDots>;

  const login = ({ token, user }: { token: string; user: User }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
    setLoading(false);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    setLoading(false);
    // router.push('/');
  };

  // if (loading) return <LoadingDots />;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        setLoading,
        setUser,
        token,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
