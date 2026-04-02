const supabase = require('../supabaseClient');

async function saveWorksheet(title, data) {
    return await supabase.from('worksheets').insert([{ title, data }]);
}

async function getWorksheets() {
    return await supabase.from('worksheets').select('*').order('created_at', { ascending: false });
}

async function getWorksheetById(id) {
    return await supabase.from('worksheets').select('*').eq('id', id).single();
}

async function deleteWorksheet(id) {
    return await supabase.from('worksheets').delete().eq('id', id);
}

module.exports = {
    saveWorksheet,
    getWorksheets,
    getWorksheetById,
    deleteWorksheet
};