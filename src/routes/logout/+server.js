import { redirect } from "@sveltejs/kit";

export const POST = async ({ locals: { supabase } }) => {
  try {
    await supabase.auth.signOut();
  } catch {
    // Handle error
  }
  throw redirect(303, "/login");
};
