const bcrypt = require('bcrypt');
const saltRounds = 10; // Un valor entre 10 y 12 es común y seguro

// *** REEMPLAZA 'password123' con la contraseña que quieres hashear ***
const plainPassword = 'clave';

bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error generating hash:', err);
    } else {
        console.log('Contraseña original:', plainPassword);
        console.log('Hash BCrypt generado:', hash);
        // *** COPIA este hash. Lo insertarás en tu base de datos. ***
    }
});