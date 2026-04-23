const supabase = require('../supabaseClient');

async function getUserFromToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");

  const { data, error } = await supabase.auth.getUser(token);

  if (error) return null;

  return data.user;
}

module.exports = getUserFromToken;