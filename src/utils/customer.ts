import axios from "axios";

export interface AuthUser {
  id: number;
  name?: string;
  email: string;
  phone?: string;
  role: "CUSTOMER" | "ADMIN";
}

export const getCustomerInfo = async (): Promise<AuthUser | null> => {
  const token = localStorage.getItem("token");

  if (!token) return null;

  try {
    const res = await axios.get<AuthUser>(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    localStorage.setItem("user", JSON.stringify(res.data));
    return res.data;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
};
