const supabase = require('../supabaseClient');

async function saveWorksheet(title, data, user_id) {
    return await supabase
        .from('worksheets')
        .insert([{ title, data, user_id }]);
}

async function getWorksheets(user_id) {
    return await supabase
    .from('worksheets')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
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

module.exports = {
    saveWorksheet,
    getWorksheets,
    getWorksheetById,
    deleteWorksheet
};