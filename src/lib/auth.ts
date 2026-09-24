import { apiFetch } from "./api";
import type { CRMUser } from "../types";

export async function getMe(): Promise<CRMUser | null> {
  try {
    const response = await apiFetch<{
      success: boolean;
      user: CRMUser;
    }>("/api/auth/me");

    return response.user ?? null;
  } catch {
    return null;
  }
}

export async function login(
  email: string,
  password: string
) {
  return apiFetch<{
    success: boolean;
    user: CRMUser;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function logout() {
  await apiFetch<{ success: boolean }>(
    "/api/auth/logout",
    {
      method: "POST",
    }
  );

  // Make sure the user leaves the protected dashboard.
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
