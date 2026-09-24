import { createAuthServerClient } from "@/src/lib/supabase/server-auth";

export interface CurrentCRMUser {
  id: string;
  authUserId: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

export async function getCurrentCRMUser(): Promise<CurrentCRMUser> {
  const supabase = await createAuthServerClient();

  // Get the authenticated Supabase Auth user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("UNAUTHENTICATED");
  }
  if (!user.email?.toLowerCase().endsWith("@inditronics.com")) {
    throw new Error("DOMAIN_NOT_ALLOWED");
  }

  // Find the corresponding CRM user
  const { data: crmUser, error: crmError } = await supabase
    .from("crm_users")
    .select(`
      id,
      email,
      name,
      role,
      "isActive",
      auth_user_id
    `)
    .eq("auth_user_id", user.id)
    .single();

  if (crmError || !crmUser) {
    throw new Error("CRM_USER_NOT_FOUND");
  }

  if (!crmUser.isActive) {
    throw new Error("USER_INACTIVE");
  }

  return {
    id: crmUser.id,
    authUserId: user.id,
    email: crmUser.email,
    name: crmUser.name,
    role: crmUser.role,
    isActive: crmUser.isActive,
  };
}