/**
 * Application configuration module
 * Contains all application-level configuration settings
 */

const config = {
    // Server configuration
    port: process.env.PORT || 3000,
    
    // JWT configuration
    jwtSecret: process.env.SESSION_SECRET || 'tu-secreto-super-seguro-aqui-cambiar-en-produccion',
    jwtExpiresIn: '24h',
    
    // Cookie configuration
    cookie: {
        name: 'nikolito-token',
        httpOnly: true,
        secure: true, // Always true for Vercel (HTTPS)
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax', // Optimized for Vercel
        path: '/'
    },
    
    // Login attempt limits
    loginAttempts: {
        maxAttempts: 5,
        lockoutDuration: 1 * 60 * 1000 // 1 minute in milliseconds
    },
    
    // Test users (for development)
    testUsers: [
        { username: 'admin', password: 'admin123' },
        { username: 'marcelo', password: 'marcelo123' },
        { username: 'test', password: 'test123' }
    ],
    
    // Search configuration
    search: {
        allowedFields: ['direccion', 'nis', 'consecutive', 'serie_medidor'],
        maxResults: 100
    }
};

module.exports = config;
