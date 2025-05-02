// app.js

const express = require('express');
const mssql = require('mssql');
const dbConfig = require('./config/dbConfig'); // *** Asumiendo que moviste dbConfig.js a una carpeta 'config' ***
// Si dbConfig.js sigue en la raíz, usa './dbConfig' en su lugar
const path = require('path');
const session = require('express-session');
// const bcrypt = require('bcrypt'); // bcrypt solo se usa en routes/auth.js ahora

// --- Importa tus módulos de rutas y middleware ---
const searchRoutes = require('./routes/search');       // Importa el router del buscador
const authRoutes = require('./routes/auth');         // Importa el router de autenticación
const authMiddleware = require('./middleware/auth');   // Importa el middleware de autenticación
// --- Fin Importación ---

const app = express();
const port = process.env.PORT || 3000; // Usa el puerto del entorno o 3000

// --- Configuración de Middleware Global ---

// 1. Servir archivos estáticos (CSS, JS, imágenes, etc. desde la carpeta 'public')
app.use(express.static(path.join(__dirname, 'public')));

// 2. Procesar datos de formularios (urlencoded para formularios HTML estándar, json si usas APIs)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 3. Configurar el motor de plantillas EJS
app.set('view engine', 'ejs'); // Le dice a Express que use EJS para renderizar
app.set('views', path.join(__dirname, 'views')); // Le dice a Express dónde están tus archivos .ejs
app.set('view cache', false);

// 4. Configuración de Sesiones (¡MUY IMPORTANTE: Va ANTES de cualquier ruta o middleware que use req.session!)
// *** Configura un secreto SEGURO. En producción, lee esto de una variable de entorno. ***
const sessionSecret = process.env.SESSION_SECRET || 'TU_SECRETO_LARGO_Y_ALEATORIO_PARA_SESIONES_POR_DEFECTO';

app.use(session({
   secret: sessionSecret, // Usa el secreto de sesión
   resave: false, // No guardar la sesión si no ha cambiado
   saveUninitialized: false, // No crear una sesión hasta que algo se almacene (ej: después del login)
   cookie: {
       secure: process.env.NODE_ENV === 'production', // Usar cookies seguras (solo sobre HTTPS) en producción
       maxAge: 1000 * 60 * 60 // Tiempo de vida de la cookie en milisegundos (ej: 1 hora)
       // maxAge: 1000 * 60 * 1 // 1 minuto para coincidir con tu CFML si prefieres
   }
   // Para producción, necesitas un store de sesiones persistente (ej: 'connect-redis', 'connect-session-sequelize')
   // store: new ...
}));

// --- Fin Configuración de Middleware Global ---


// --- Conexión a la Base de Datos ---
// Asegúrate de que dbConfig.js esté en la ubicación correcta (config/dbConfig.js o dbConfig.js)
mssql.connect(dbConfig)
    .then(pool => {
        console.log('Conectado a SQL Server');
        app.locals.db = pool; // Guarda el pool en app.locals para que las rutas puedan acceder a él (req.app.locals.db)

        // --- Montaje de Routers y Aplicación de Middleware de Protección ---

        // 1. Monta las rutas de Autenticación (login, logout)
        // Estas rutas NO requieren autenticación previa. Se montan en la ruta base '/auth'.
        // Accederás a /auth/login, /auth/logout.
        app.use('/auth', authRoutes);

        // Opcional: Si quieres que la página de login (/auth/login) no sea accesible si ya estás logueado,
        // puedes aplicar el middleware 'isGuest' en routes/auth.js:
        // router.get('/login', authMiddleware.isGuest, (req, res) => { ... });


        // *** 2. Middleware de Protección ***
        // Aplica el middleware 'isAuthenticated' a TODAS las rutas que se definan DESPUÉS de esta línea.
        // Esto protege las rutas del buscador y cualquier otra ruta definida debajo.
        app.use(authMiddleware.isAuthenticated);


        // 3. Monta las rutas del Buscador
        // Estas rutas están ahora protegidas por el middleware 'isAuthenticated' de arriba.
        // La ruta base '/' significa que accederás a / y /buscar.
        app.use('/', searchRoutes);

        // --- Fin Montaje ---

        // *** Middleware para manejar rutas no encontradas (404) ***
        // Este middleware siempre va al final, después de todas tus rutas válidas.
        // Si llegas aquí, ninguna ruta anterior coincidió con la solicitud.
        app.use((req, res, next) => {
            res.status(404).send('Página no encontrada.'); // O renderiza una plantilla 404.ejs
        });


        // Inicia el servidor Express
        app.listen(port, () => {
            console.log(`Servidor Express escuchando en http://localhost:${port}`);
            console.log(`Accede al login en http://localhost:${port}/auth/login`);
        });

    })
    .catch(err => {
        console.error('Error crítico al conectar con SQL Server:', err);
        // En caso de error de conexión crítico, salimos del proceso
        process.exit(1);
    });