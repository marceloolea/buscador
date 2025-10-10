const { verifyToken } = require('../services/authService');
const config = require('../config/app');

/**
 * Authentication middleware module
 * Contains middleware functions for authentication and authorization
 */

/**
 * Middleware to verify authentication using JWT tokens
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
function requireAuth(req, res, next) {
    console.log(`🔐 Verificando autenticación para: ${req.path}`);
    
    // Get JWT token from cookies
    const token = req.cookies[config.cookie.name];
    console.log(`🍪 Token encontrado: ${token ? 'SÍ' : 'NO'}`);
    
    if (token) {
        const decoded = verifyToken(token);
        console.log(`🔓 Token válido: ${decoded ? 'SÍ' : 'NO'}`);
        if (decoded) {
            req.userId = decoded.userId;
            console.log(`✅ Usuario autenticado ID: ${decoded.userId}`);
            return next();
        }
    }

    console.log(`❌ Redirigiendo a login desde: ${req.path}`);
    res.redirect('/login');
}

/**
 * Middleware to check if user is already authenticated
 * Redirects to dashboard if already logged in
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
function redirectIfAuthenticated(req, res, next) {
    const token = req.cookies[config.cookie.name];
    if (token && verifyToken(token)) {
        return res.redirect('/dashboard');
    }
    next();
}

module.exports = {
    requireAuth,
    redirectIfAuthenticated
};
