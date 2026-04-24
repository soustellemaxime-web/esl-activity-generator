const supabase = require('../supabaseClient');

async function getPublicItems() {
  const { data, error } = await supabase
    .from('worksheets')
    .select("id, title, type, rating_avg")
    .eq("visibility", "public")
    .order('created_at', { ascending: false });
  if (error) return { error };
  return { data };
}

async function getPublicItemById(id) {
  const { data, error } = await supabase
    .from("worksheets")
    .select("*")
    .eq("id", id)
    .eq("visibility", "public")
    .single();
  if (error) return { error };
  return { data };
}

module.exports = {
  getPublicItems,
  getPublicItemById
};