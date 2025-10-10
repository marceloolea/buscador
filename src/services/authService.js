const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const config = require('../config/app');

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
    const { data, error } = await supabase
        .from('intentos_login')
        .select('intentos_fallidos, bloqueado_hasta')
        .eq('usuario', usuario)
        .single();

    if (error) return { bloqueado: false, intentos: 0 };

    // Check if user is blocked
    if (data.bloqueado_hasta && new Date(data.bloqueado_hasta) > new Date()) {
        return { bloqueado: true, intentos: data.intentos_fallidos };
    }

    // If lockout time has passed, reset attempts
    if (data.bloqueado_hasta && new Date(data.bloqueado_hasta) <= new Date()) {
        await supabase
            .from('intentos_login')
            .update({ intentos_fallidos: 0, bloqueado_hasta: null })
            .eq('usuario', usuario);
        return { bloqueado: false, intentos: 0 };
    }

    return { bloqueado: false, intentos: data.intentos_fallidos };
}

/**
 * Increment failed login attempts
 * @param {string} usuario - Username
 * @returns {number} New attempt count
 */
async function incrementarIntentos(usuario) {
    const { data } = await supabase
        .from('intentos_login')
        .select('intentos_fallidos')
        .eq('usuario', usuario)
        .single();

    const nuevosIntentos = (data?.intentos_fallidos || 0) + 1;
    let bloqueadoHasta = null;

    // If reaches max attempts, block for configured duration
    if (nuevosIntentos >= config.loginAttempts.maxAttempts) {
        bloqueadoHasta = new Date(Date.now() + config.loginAttempts.lockoutDuration);
    }

    // Update existing record or create new one
    if (data) {
        await supabase
            .from('intentos_login')
            .update({
                intentos_fallidos: nuevosIntentos,
                bloqueado_hasta: bloqueadoHasta,
                updated_at: new Date()
            })
            .eq('usuario', usuario);
    } else {
        await supabase
            .from('intentos_login')
            .insert({
                usuario: usuario,
                intentos_fallidos: nuevosIntentos,
                bloqueado_hasta: bloqueadoHasta
            });
    }

    return nuevosIntentos;
}

/**
 * Reset login attempts for a user
 * @param {string} usuario - Username
 */
async function resetearIntentos(usuario) {
    await supabase
        .from('intentos_login')
        .update({ intentos_fallidos: 0, bloqueado_hasta: null, updated_at: new Date() })
        .eq('usuario', usuario);
}

/**
 * Validate user credentials
 * @param {string} usuario - Username
 * @param {string} password - Password
 * @returns {object|null} User data if valid, null otherwise
 */
async function validateCredentials(usuario, password) {
    // For now, use only test users (no database lookup needed)
    const testUser = config.testUsers.find(testUser =>
        testUser.username === usuario && testUser.password === password
    );

    if (testUser) {
        // Return a mock user object
        return {
            id: testUser.username === 'admin' ? 1 : testUser.username === 'marcelo' ? 2 : 3,
            usuario: testUser.username,
            activo: true
        };
    }

    return null;
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
