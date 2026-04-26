const supabase = require('../supabaseClient');

async function getTodayDownloads(user_id, type = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let query = supabase
    .from('downloads')
    .select('id')
    .eq('user_id', user_id)
    .gte('created_at', today.toISOString());
  if (type) {
    query = query.eq('type', type);
  }
  return await query;
}

async function addDownload(user_id, type = "generator") {
  return await supabase
    .from('downloads')
    .insert({ user_id, type });
}

module.exports = {
  getTodayDownloads,
  addDownload
};