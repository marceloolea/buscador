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
 * @param {string} comuna - Comuna filter (optional, for consecutive searches)
 * @returns {object} Search results
 */
async function buscarDatos(valor, campo, userId = null, comuna = null) {
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
    const comunaLog = comuna ? ` en comuna "${comuna}"` : '';
    console.log(`🔍 Búsqueda: "${valor}" en campo "${campo}"${comunaLog} por usuario ${usuarioLog}`);

    let query = supabase
        .from('reporte_fnl')
        .select('*'); // Select all columns

    let data, error;

    // Handle different search types based on field
    if (campo === 'nis') {
        // NIS: Exact match (unique identifier)
        const result = await query.eq('nis', parseInt(valor)).limit(1);
        data = result.data;
        error = result.error;
        console.log(`🔍 Búsqueda exacta de NIS: ${valor}`);
    } else if (campo === 'consecutive') {
        // Consecutive: Search with optional comuna filter
        if (comuna) {
            // Search with comuna filter - exact match for consecutive
            const consecutiveNum = parseInt(valor);
            if (isNaN(consecutiveNum)) {
                // If not a number, search as text in all fields
                const result = await query
                    .or(`consecutive.eq.${valor},consecutive.ilike.%${valor}%`)
                    .eq('comuna', comuna)
                    .limit(config.search.maxResults);
                data = result.data;
                error = result.error;
            } else {
                // If it's a number, search exactly
                const result = await query
                    .eq('consecutive', consecutiveNum)
                    .eq('comuna', comuna)
                    .limit(config.search.maxResults);
                data = result.data;
                error = result.error;
            }
            console.log(`🔍 Búsqueda de consecutivo "${valor}" en comuna "${comuna}"`);
        } else {
            // Search without comuna filter (all comunas) - use existing function
            const result = await supabase.rpc('buscar_numerico', {
                campo_nombre: campo,
                valor_buscar: valor
            });
            data = result.data;
            error = result.error;
            console.log(`🔍 Búsqueda parcial de consecutivo: ${valor} (todas las comunas)`);
        }
    } else {
        // Text fields: Partial match
        const result = await query.ilike(campo, `%${valor}%`).limit(config.search.maxResults);
        data = result.data;
        error = result.error;
        console.log(`🔍 Búsqueda parcial de ${campo}: ${valor}`);
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
