const { supabase } = require('../config/database');
const config = require('../config/app');

/**
 * Search service module
 * Handles database search operations
 */

/**
 * Search in database by field and value
 * @param {string} valor - Search value
 * @param {string} campo - Field to search in
 * @param {number} userId - User ID for logging
 * @returns {object} Search results
 */
async function buscarDatos(valor, campo, userId = null) {
    // Validate parameters
    if (!valor || !campo) {
        throw new Error('Valor y campo son requeridos');
    }

    // Validate field is allowed
    if (!config.search.allowedFields.includes(campo)) {
        throw new Error('Campo no válido');
    }

    // Log search for debugging
    const usuarioLog = userId ? `ID:${userId}` : 'Usuario';
    console.log(`🔍 Búsqueda: "${valor}" en campo "${campo}" por usuario ${usuarioLog}`);

    let query = supabase
        .from('reporte_fnl')
        .select('*'); // Select all columns

    let data, error;

    // For numeric fields, use custom function
    if (campo === 'nis' || campo === 'consecutive') {
        const result = await supabase.rpc('buscar_numerico', {
            campo_nombre: campo,
            valor_buscar: valor
        });
        data = result.data;
        error = result.error;
    } else {
        // For text fields, use normal API
        const result = await query.ilike(campo, `%${valor}%`).limit(config.search.maxResults);
        data = result.data;
        error = result.error;
    }

    if (error) {
        console.error('Error en búsqueda:', error);
        throw new Error('Error en la búsqueda');
    }

    console.log(`✅ Encontrados ${data.length} resultados`);

    return {
        resultados: data,
        total: data.length,
        campo: campo,
        valor: valor
    };
}

module.exports = {
    buscarDatos
};
