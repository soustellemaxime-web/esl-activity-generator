const supabase = require('../supabaseClient');

async function getUserFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data.user;
}

async function getUserPlan(user_id) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user_id)
    .single();
  if (error) return null;
  return profile.plan;
}

module.exports = {
  getUserFromToken,
  getUserPlan
};