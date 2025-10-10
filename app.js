const express = require('express');
const cookieParser = require('cookie-parser');

// Import configuration
const config = require('./src/config/app');

// Import routes
const authRoutes = require('./src/routes/auth');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = config.port;

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());

// Routes setup
app.use('/', authRoutes);
app.use('/api', apiRoutes);

// Server startup
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log('📊 Base de datos conectada a Supabase');
    console.log('👤 Usuarios disponibles:', config.testUsers.map(u => u.username).join(', '));
    console.log('🔑 Contraseñas:', config.testUsers.map(u => u.password).join(', '));
    console.log('🔧 Modo: Solo JWT (sin sesiones en memoria)');
    console.log('🍪 Cookie sameSite:', config.cookie.sameSite, '(optimizado para Vercel)');
    console.log('✅ Aplicación modularizada correctamente');
});