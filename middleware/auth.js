// middleware/auth.js

// Middleware para verificar si el usuario está autenticado
function isAuthenticated(req, res, next) {
    // Verifica si la variable de sesión 'isLoggedIn' existe y es 'true'
    if (req.session && req.session.isLoggedIn === true) {
        // Si el usuario está logueado, llama a next() para permitir que la solicitud continúe a la siguiente función/ruta
        return next();
    } else {
        // Si el usuario NO está logueado:
        // 1. Guarda un mensaje en la sesión para mostrar en la página de login
        req.session.loginMessage = 'Por favor, inicia sesión para acceder.';
        // 2. Redirige al usuario a la página de login
        // Usa la ruta completa del login definida en app.js (ej: /auth/login)
        return res.redirect('/auth/login');
    }
}

// Middleware opcional: Para usar en rutas que NO deben ser accesibles si ya estás logueado
// Ejemplo: la página de login o registro. Si intentas acceder y ya estás logueado, te redirige.
function isGuest(req, res, next) {
     if (req.session && req.session.isLoggedIn === true) {
         // Si está autenticado, redirige a la página principal (o a donde quieras después del login)
         return res.redirect('/');
     } else {
         // Si NO está autenticado, permite que la solicitud continúe (a la página de login/registro)
         return next();
     }
}

// Exporta las funciones middleware para que app.js pueda importarlas
module.exports = {
    isAuthenticated: isAuthenticated,
    isGuest: isGuest // Puedes exportar isGuest si lo necesitas para otras rutas
};