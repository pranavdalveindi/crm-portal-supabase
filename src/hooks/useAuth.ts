"use client";

import { useEffect, useState } from "react";
import type { CRMUser } from "../types";
import { getMe } from "../lib/auth";

export function useAuth() {
  const [user, setUser] = useState<CRMUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getMe().then((currentUser) => {
      if (!active) return;

      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return {
    user,
    loading,
    setUser,
  };
}

