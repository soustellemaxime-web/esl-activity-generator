const supabase = require('../supabaseClient');

async function saveWorksheet(title, data, user_id, type = "worksheet") {
    return await supabase
        .from('worksheets')
        .insert([{ title, data, user_id, type }]);
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
        .eq('user_id', user_id)
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

module.exports = {
    saveWorksheet,
    getWorksheets,
    getWorksheetById,
    deleteWorksheet,
    countUserWorksheets
};