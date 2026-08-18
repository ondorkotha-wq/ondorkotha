"use client";

import axios from "axios";

export const handleUploadWithCloudinary = async (file: File) => {
  if (!file) return null;

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image must be under 10MB");
  }

  const token = localStorage.getItem("token");

  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/cloudinary-signature`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const { signature, timestamp, apiKey, cloudName, folder } = data;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const uploadData = await uploadRes.json();

  const optimizedUrl = uploadData.secure_url.replace(
    "/upload/",
    "/upload/w_1920,q_auto,f_auto/"
  );

  return optimizedUrl;
};
