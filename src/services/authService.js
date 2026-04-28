const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const config = require('../config/app');

// Global login attempts counter (resets on server restart)
let globalLoginAttempts = {
    intentos: 0,
    bloqueadoHasta: null
};

/**
 * Authentication service module
 * Handles JWT operations and login attempt management
 */

/**
 * Generate JWT token for user
 * @param {number} userId - User ID
 * @returns {string} JWT token
 */
function generateToken(userId) {
    return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object|null} Decoded token or null if invalid
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (error) {
        return null;
    }
}

/**
 * Check login attempts for a user
 * @param {string} usuario - Username
 * @returns {object} Object with blocked status and attempt count
 */
async function verificarIntentos(usuario) {
    // Check if globally blocked
    if (globalLoginAttempts.bloqueadoHasta && new Date(globalLoginAttempts.bloqueadoHasta) > new Date()) {
        return { bloqueado: true, intentos: globalLoginAttempts.intentos };
    }

    // If lockout time has passed, reset attempts
    if (globalLoginAttempts.bloqueadoHasta && new Date(globalLoginAttempts.bloqueadoHasta) <= new Date()) {
        globalLoginAttempts = { intentos: 0, bloqueadoHasta: null };
        console.log('🔓 Bloqueo global expirado - intentos reseteados');
        return { bloqueado: false, intentos: 0 };
    }

    return { bloqueado: false, intentos: globalLoginAttempts.intentos };
}

/**
 * Increment failed login attempts
 * @param {string} usuario - Username
 * @returns {number} New attempt count
 */
async function incrementarIntentos(usuario) {
    const nuevosIntentos = globalLoginAttempts.intentos + 1;
    let bloqueadoHasta = null;

    // If reaches max attempts, block globally for configured duration
    if (nuevosIntentos >= config.loginAttempts.maxAttempts) {
        bloqueadoHasta = new Date(Date.now() + config.loginAttempts.lockoutDuration);
        console.log(`🔒 BLOQUEO GLOBAL activado por ${config.loginAttempts.lockoutDuration / 1000} segundos`);
    }

    // Update global counter
    globalLoginAttempts = {
        intentos: nuevosIntentos,
        bloqueadoHasta: bloqueadoHasta
    };

    console.log(`🔒 Intento fallido con usuario "${usuario}": ${nuevosIntentos}/${config.loginAttempts.maxAttempts} intentos globales`);

    return nuevosIntentos;
}

/**
 * Reset login attempts for a user
 * @param {string} usuario - Username
 */
async function resetearIntentos(usuario) {
    globalLoginAttempts = { intentos: 0, bloqueadoHasta: null };
    console.log(`✅ Intentos globales reseteados tras login exitoso de: ${usuario}`);
}

/**
 * Validate user credentials
 * @param {string} usuario - Username
 * @param {string} password - Password
 * @returns {object|null} User data if valid, null otherwise
 */
async function validateCredentials(usuario, password) {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, usuario, password, activo')
            .eq('usuario', usuario)
            .eq('activo', true)
            .single();

        if (error || !data) return null;

        if (data.password !== password) return null;

        return {
            id: data.id,
            usuario: data.usuario,
            activo: data.activo
        };
    } catch (error) {
        console.error('Error validando credenciales:', error);
        return null;
    }
}

/**
 * Create user session in database
 * @param {number} userId - User ID
 * @returns {string} Session token
 */
async function createSession(userId) {
    const sessionToken = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await supabase
        .from('sesiones')
        .insert({
            usuario_id: userId,
            session_token: sessionToken,
            expires_at: expiresAt
        });

    return sessionToken;
}

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {object|null} User data or null
 */
async function getUserById(userId) {
    try {
        const { data: userData } = await supabase
            .from('usuarios')
            .select('usuario')
            .eq('id', userId)
            .single();
        return userData;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken,
    verificarIntentos,
    incrementarIntentos,
    resetearIntentos,
    validateCredentials,
    createSession,
    getUserById
};
