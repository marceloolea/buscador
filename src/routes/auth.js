const express = require('express');
const router = express.Router();

const { 
    generateToken, 
    verifyToken, 
    verificarIntentos, 
    incrementarIntentos, 
    resetearIntentos, 
    validateCredentials, 
    createSession,
    getUserById 
} = require('../services/authService');
const { requireAuth, redirectIfAuthenticated } = require('../middleware/auth');
const { loginTemplate, dashboardTemplate } = require('../views/templates');
const config = require('../config/app');

/**
 * Authentication routes module
 * Handles login, logout, and dashboard routes
 */

// Root route - redirect based on authentication status
router.get('/', (req, res) => {
    const token = req.cookies[config.cookie.name];
    if (token && verifyToken(token)) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
    const error = req.query.error || '';
    res.send(loginTemplate(error));
});

// Login form submission
router.post('/login', async (req, res) => {
    const { usuario, password } = req.body;

    try {
        // Check login attempts
        const { bloqueado } = await verificarIntentos(usuario);

        if (bloqueado) {
            return res.redirect('/login?error=Usuario bloqueado por 1 minuto debido a múltiples intentos fallidos');
        }

        // Validate credentials
        const userData = await validateCredentials(usuario, password);

        if (!userData) {
            const nuevosIntentos = await incrementarIntentos(usuario);
            const intentosRestantes = config.loginAttempts.maxAttempts - nuevosIntentos;

            if (nuevosIntentos >= config.loginAttempts.maxAttempts) {
                return res.redirect('/login?error=Usuario bloqueado por 1 minuto debido a múltiples intentos fallidos');
            } else {
                return res.redirect(`/login?error=Usuario o contraseña incorrectos. Intentos restantes: ${intentosRestantes}`);
            }
        }

        // Successful login
        await resetearIntentos(usuario);
        console.log(`✅ Login exitoso para usuario: ${usuario}`);

        // Create JWT token
        const jwtToken = generateToken(userData.id);
        console.log(`🔑 JWT token generado para usuario ID: ${userData.id}`);

        // Set cookie with JWT
        res.cookie(config.cookie.name, jwtToken, config.cookie);
        console.log(`🍪 Cookie JWT configurada para usuario: ${usuario}`);

        // Create session in database
        await createSession(userData.id);

        console.log(`🚀 Redirigiendo a dashboard para usuario: ${usuario}`);
        res.redirect('/dashboard');

    } catch (error) {
        console.error('Error en login:', error);
        res.redirect('/login?error=Error interno del servidor');
    }
});

// Dashboard page
router.get('/dashboard', requireAuth, async (req, res) => {
    // Get username from JWT
    let usuario = 'Usuario';
    if (req.userId) {
        try {
            const userData = await getUserById(req.userId);
            if (userData) {
                usuario = userData.usuario;
            }
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
        }
    }

    res.send(dashboardTemplate(usuario));
});

// Logout
router.get('/logout', (req, res) => {
    // Clear JWT cookie
    res.clearCookie(config.cookie.name, {
        httpOnly: config.cookie.httpOnly,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        path: config.cookie.path
    });

    // Redirect to login
    res.redirect('/login');
});

module.exports = router;
