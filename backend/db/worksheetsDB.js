const supabase = require('../supabaseClient');

async function saveWorksheet(title, data, user_id, type = "worksheet", visibility = "private") {
    return await supabase
        .from('worksheets')
        .insert([{ 
            title, 
            data, 
            user_id, 
            type,
            visibility
        }]);
}

async function updateWorksheet(id, title, data, user_id, type, visibility) {
    return await supabase
        .from('worksheets')
        .update({
            title,
            data,
            type,
            visibility
        })
        .eq('id', id)
        .eq('user_id', user_id);
}

async function getWorksheets(user_id, type = null) {
    let query = supabase
        .from('worksheets')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
    if (type) {
        query = query.eq('type', type);
    }
    return await query;
}

async function getWorksheetById(id, user_id) {
    return await supabase
        .from('worksheets')
        .select('*')
        .eq('id', id)
        .or(`user_id.eq.${user_id},visibility.eq.public`)
        .single();
}

async function deleteWorksheet(id, user_id) {
    return await supabase
        .from('worksheets')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);
}

async function countUserWorksheets(user_id) {
    const { data, error } = await supabase
        .from('worksheets')
        .select('id')
        .eq('user_id', user_id);
    if (error) return { error };
    return { count: data.length };
}

async function getUserWorksheetStats(user_id) {
    const { data, error } = await supabase
        .from("worksheets")
        .select("*")
        .eq("user_id", user_id);
    if (error) return { error };
    return data;
}

async function getUserWorksheetsPaginated(userId, page = 1, limit = 8, isOwner = false) {
  const offset = (page - 1) * limit;
  let query = supabase
    .from("worksheets")
    .select("*", { count: "exact" })
    .eq("user_id", userId);
  if (!isOwner) {
    query = query.eq("visibility", "public");
  }
  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) throw error;
  return {
    items: data,
    total: count
  };
}

module.exports = {
    saveWorksheet,
    updateWorksheet,
    getWorksheets,
    getWorksheetById,
    deleteWorksheet,
    countUserWorksheets,
    getUserWorksheetStats,
    getUserWorksheetsPaginated
};