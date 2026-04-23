const supabase = require('../supabaseClient');

async function getTodayDownloads(user_id) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return await supabase
    .from('downloads')
    .select('id')
    .eq('user_id', user_id)
    .gte('created_at', today.toISOString());
}

async function addDownload(user_id) {
  return await supabase
    .from('downloads')
    .insert({ user_id });
}

module.exports = {
  getTodayDownloads,
  addDownload
};