// lib/hash.ts
import { GTMUserData } from "./gtm";

async function hashValue(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function buildUserData(params: {
  email?: string;
  phone?: string;
  name?: string;
  city?: string;
}): Promise<GTMUserData> {
  const { email, phone, name, city } = params;

  const nameParts = name?.trim().split(" ") ?? [];
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  // Normalize: strip +880 or leading 0 → prepend 880
  const normalizedPhone = phone
    ? "880" + phone.replace(/^(\+?880|0)/, "")
    : undefined;

  const [em, ph, fn, ln, ct, country] = await Promise.all([
    email           ? hashValue(email)           : Promise.resolve(undefined),
    normalizedPhone ? hashValue(normalizedPhone) : Promise.resolve(undefined),
    firstName       ? hashValue(firstName)       : Promise.resolve(undefined),
    lastName        ? hashValue(lastName)        : Promise.resolve(undefined),
    city            ? hashValue(city)            : Promise.resolve(undefined),
    hashValue("bd"),
  ]);

  return { em, ph, fn, ln, ct, country };
}