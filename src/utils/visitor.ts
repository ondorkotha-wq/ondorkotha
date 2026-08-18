import { isAuthenticated } from "./auth";

export const getVisitorId = async () => {
  // console.log("we are in getVisitorId");

  let visitorId = localStorage.getItem("visitorId");

  if (!visitorId && !isAuthenticated()) {
    const random = Math.floor(Math.random() * 1000);

    visitorId = `${Date.now()}_${random}`;
    localStorage.setItem("visitorId", visitorId);

    // notify backend
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/guest/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    });
  }

  return visitorId;
};
