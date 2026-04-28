// routes/auth.js

const express = require('express');
const router = express.Router(); // Crea un objeto router para este módulo
const mssql = require('mssql'); // Necesario para interactuar con la DB
const bcrypt = require('bcrypt'); // ¡Necesario para verificar contraseñas hasheadas!

// La ruta base para estas rutas se definirá en app.js (ej: /auth)

// Ruta GET '/login' para mostrar el formulario de login
// No requiere autenticación previa (es una página pública)
router.get('/login', (req, res) => {
    // *** Accede a la sesión via req.session ***
    // Intenta obtener un mensaje de la sesión (ej: "login requerido", "usuario o clave incorrectos")
    let message = req.session.loginMessage;
    req.session.loginMessage = null; // Limpia el mensaje de la sesión una vez que lo leíste

    // Renderiza la plantilla 'login.ejs'
    res.render('login', {
        message: message, // Pasa el mensaje a la plantilla
        username: '' // No pasamos el nombre de usuario inicialmente (o pasas req.session.username si quieres que se mantenga)
    });
});

// Ruta POST '/login' para procesar el login
router.post('/login', async (req, res) => {
    const { username, password } = req.body; // Obtiene usuario y contraseña del formulario

    // Validación básica (que los campos no estén vacíos)
     if (!username || !password) {
         req.session.loginMessage = 'Por favor, ingresa usuario y contraseña.';
         // *** Redirige de vuelta al formulario de login ***
         // Es mejor redirigir después de un POST para evitar problemas al recargar la página
         return res.redirect('/auth/login');
     }

    try {
        const request = req.app.locals.db.request(); // Accede al pool de la DB

        // Consulta para obtener el usuario por NombreUsuario (SIN la contraseña en la consulta WHERE)
        const loginQuery = `
            SELECT Id, NombreUsuario, Contrasena, IsActive
            FROM Usuarios -- O Users si tu tabla se llama asi en SQL Server
            WHERE NombreUsuario = @username
        `;

        // Parametriza solo el nombre de usuario
        request.input('username', mssql.VarChar, username);

        const result = await request.query(loginQuery);

        // --- Lógica de verificación con BCrypt ---
        let loginSuccessful = false;
        let user = null;

        if (result.recordset.length === 1) {
            user = result.recordset[0];
            const storedHash = user.Contrasena; // Asume que el campo Contrasena guarda el hash bcrypt
            const isActive = user.IsActive;    // Asume que tienes un campo IsActive

            if (isActive) {
                 // Compara la contraseña ingresada con el hash almacenado de forma segura
                 loginSuccessful = await bcrypt.compare(password, storedHash);
            }
        }
        // --- Fin Lógica de verificación con BCrypt ---


        if (loginSuccessful) {
            // Login exitoso
            console.log(`Login exitoso para el usuario: ${user.NombreUsuario}`);

            // --- Iniciar Sesión (establecer variables en req.session) ---
            req.session.isLoggedIn = true; // Marca la sesión como logueada
            req.session.userID = user.Id;
            req.session.username = user.NombreUsuario; // Guarda el nombre de usuario en sesión
            req.session.loginMessage = null; // Limpia cualquier mensaje de login anterior

            // *** Redirige al usuario a la página principal (que ahora está protegida) ***
            res.redirect('/'); // Redirige a la ruta raíz, que mostrará el buscador si el middleware lo permite

        } else {
            // Usuario no encontrado, inactivo o contraseña incorrecta
            console.log(`Intento de login fallido para el usuario: ${username}`);
             req.session.loginMessage = 'Usuario o contraseña incorrectos.'; // Guarda el mensaje en la sesión
             // *** Redirige de vuelta al formulario de login para mostrar el mensaje ***
             res.redirect('/auth/login'); // El GET /auth/login leerá el mensaje de la sesión

        }

    } catch (err) {
        console.error('Error al procesar el login:', err);
        req.session.loginMessage = 'Error interno del servidor al intentar iniciar sesión.'; // Guarda el mensaje en la sesión
        // *** Redirige en caso de error ***
        res.status(500).redirect('/auth/login'); // Redirige con un status code de error
    }
});

// Ruta GET '/auth/logout' para cerrar sesión
// Esta ruta también requerirá autenticación para poder ser accedida (se protegerá en app.js)
router.get('/logout', (req, res) => {
    // Destruye la sesión
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            // En una aplicación real, podrías redirigir a una página de error o mostrar un mensaje
        } else {
            console.log('Sesión cerrada.');
        }
        // *** Redirige al usuario a la página de login después de cerrar sesión ***
        res.redirect('/auth/login');
    });
});


// Exporta el router de autenticación
module.exports = router;