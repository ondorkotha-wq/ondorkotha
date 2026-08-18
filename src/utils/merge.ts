import axios from "axios";

export const mergeGuestUserWithRealUser = async (token: string) => {
  const visitorId = localStorage.getItem("visitorId");
  if (!visitorId) return true;

  try {
    const res = axios.patch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/merge-user?visitorId=${visitorId}`,
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      },
    );

    // console.log(res);

    localStorage.removeItem("visitorId");
    return true;
  } catch {
    return false;
  }
};
