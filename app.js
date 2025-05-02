const express = require('express');
const mssql = require('mssql');
const dbConfig = require('./dbConfig'); // Importa tu archivo de configuración
const path = require('path'); // Módulo nativo de Node.js para trabajar con rutas de archivos

const app = express();
const port = 3000; // O el puerto que prefieras

// Configurar Express para servir archivos estáticos (CSS, JS del frontend si los tienes)
app.use(express.static(path.join(__dirname, 'public'))); // Asume que tus archivos estáticos están en una carpeta 'public'

// Configurar Express para procesar datos de formularios (body-parser)
app.use(express.urlencoded({ extended: true })); // Para manejar application/x-www-form-urlencoded
app.use(express.json()); // Para manejar application/json (aunque para el form POST no es estrictamente necesario aquí)

// Configurar la conexión a la base de datos
mssql.connect(dbConfig)
    .then(pool => {
        // Ahora tenemos un pool de conexiones disponible para usar
        console.log('Conectado a SQL Server');

        // Guarda el pool para poder usarlo en tus rutas
        app.locals.db = pool;

        // Define tus rutas aquí (las crearemos a continuación)
        // require('./routes/search')(app); // Podrías modularizar tus rutas así en proyectos más grandes
        setupRoutes(app); // O definirlas directamente aquí para empezar

        // Inicia el servidor Express
        app.listen(port, () => {
            console.log(`Servidor Express escuchando en http://localhost:${port}`);
        });

    })
    .catch(err => {
        console.error('Error al conectar con SQL Server:', err);
        // Considera salir del proceso o intentar reconectar
        process.exit(1); // Salir si no se puede conectar a la DB
    });

// Función para configurar las rutas
function setupRoutes(app) {
    // Ruta para mostrar el formulario inicial
    app.get('/', async (req, res) => { // Marca la función como async para usar await
        try {
            const request = app.locals.db.request(); // Obtiene una solicitud desde el pool

            // --- Lógica para obtener nombres de columna (Adaptado de tu CFML) ---
            const getColumnsQuery = `
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'Tabla'
                AND COLUMN_NAME IN ('NIS', 'DIRECCION', 'SERIE_MEDIDOR')
                ORDER BY ORDINAL_POSITION
            `;
            const result = await request.query(getColumnsQuery);
            const columnNames = result.recordset.map(row => row.COLUMN_NAME); // Extrae los nombres de columna a un array
            // --- Fin Lógica para obtener nombres de columna ---

            // Generar las opciones del select
            let optionsHtml = '<option value="">-- Seleccione una columna --</option>';
            columnNames.forEach(colName => {
                optionsHtml += `<option value="${colName}">${colName}</option>`;
            });

            // Envía el HTML completo de la página con las opciones cargadas
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Buscar en la Tabla (Node.js)</title>
                    <link rel="stylesheet" href="/styles.css"> <style><link rel="stylesheet" href="/styles.css"></style> <script>
                        function clearFormAndResults() {
                            // Limpiar los campos del formulario
                            document.getElementById("searchForm").reset();
                            // Ocultar el área de resultados (si existe y está visible)
                            const resultsArea = document.getElementById("resultsArea");
                            if (resultsArea) {
                                resultsArea.classList.remove("visible");
                            }
                             // Opcional: redireccionar a la misma página para un reset completo
                             // window.location.href = window.location.pathname;
                        }
                         // Puedes mantener o quitar la lógica window.onload si no necesitas mostrar resultados en la carga inicial sin form submit
                         // window.onload = function() { ... }; // El renderizado POST ya muestra el área si hay resultados
                    </script>
                </head>
                <body>
                    <h1>Buscar en la Tabla (Node.js)</h1>
                    <form action="/buscar" method="post" id="searchForm"> <label for="columna">Seleccionar Columna:</label>
                        <select name="columna" id="columna" required>
                             ${optionsHtml} </select>
                        <br><br>
                        <label for="termino">Término de Búsqueda:</label>
                        <input type="text" name="termino" id="termino" value="" required> <br><br>
                        <button type="submit">Buscar</button>
                        <button type="button" onclick="clearFormAndResults()">Limpiar</button> </form>
                    <hr>
                    <div id="resultsArea" class="results-area">
                        </div>
                </body>
                </html>
            `);

        } catch (err) {
            console.error('Error al obtener nombres de columna:', err);
            res.status(500).send('Error al cargar la página.');
        }
    });

    // La ruta POST '/buscar' queda como estaba...
    app.post('/buscar', async (req, res) => {
        // ... (el código de la ruta POST /buscar no cambia por ahora)
        // Asegúrate de que el HTML que envías en el POST *también* genere las opciones del select dinámicamente
        // para que el dropdown siga lleno después de la búsqueda. Puedes copiar la lógica de la ruta GET.

         const { columna, termino } = req.body;

         // --- Lógica de Validación de Columna (Adaptado de tu CFML) ---
         const allowedColumns = ['NIS', 'DIRECCION', 'SERIE_MEDIDOR']; // Lista permitida de columnas
         if (!allowedColumns.includes(columna)) {
             return res.status(400).send('Columna de búsqueda seleccionada no válida.');
         }
         // --- Fin Lógica de Validación ---

         const searchTerm = `%${termino}%`;

         try {
             const request = app.locals.db.request();

             const query = `SELECT * FROM Tabla WHERE ${columna} LIKE @searchTerm`;
             request.input('searchTerm', mssql.NVarChar, searchTerm);

             const result = await request.query(query);

             let resultsHtml = '';
             if (result.recordset.length > 0) {
                 // ... (código para generar tabla normal o transpuesta, igual que antes) ...
                 if (result.recordset.length === 1) {
                     // Un solo registro: mostrar en tabla transpuesta
                     resultsHtml += '<h3>Detalle del Registro Encontrado</h3>';
                     resultsHtml += '<table border="1" class="transposed-table">';
                     resultsHtml += '<thead><tr><th>Columna</th><th>Valor</th></tr></thead><tbody>';
                     const record = result.recordset[0];
                     for (const colName in record) {
                         if (Object.hasOwnProperty.call(record, colName)) {
                              let cellValue = record[colName];
                              if (cellValue instanceof Date) {
                                  cellValue = cellValue.toISOString().slice(0, 19).replace('T', ' ');
                              } else if (cellValue === null) {
                                 cellValue = 'NULL';
                              } else {
                                 cellValue = String(cellValue);
                              }
                              resultsHtml += `<tr><td>${colName}</td><td>${cellValue}</td></tr>`;
                         }
                     }
                     resultsHtml += '</tbody></table>';

                 } else {
                     // Múltiples registros: mostrar en tabla normal
                     resultsHtml += '<h3>Registros Encontrados</h3>';
                     resultsHtml += '<table border="1">';
                     resultsHtml += '<thead><tr>';
                     for (const colName in result.recordset[0]) {
                          if (Object.hasOwnProperty.call(result.recordset[0], colName)) {
                              resultsHtml += `<th>${colName}</th>`;
                          }
                     }
                     resultsHtml += '</tr></thead>';
                     resultsHtml += '<tbody>';
                     result.recordset.forEach(record => {
                         resultsHtml += '<tr>';
                         for (const colName in record) {
                             if (Object.hasOwnProperty.call(record, colName)) {
                                 let cellValue = record[colName];
                                 if (cellValue instanceof Date) {
                                      cellValue = cellValue.toISOString().slice(0, 19).replace('T', ' ');
                                 } else if (cellValue === null) {
                                    cellValue = 'NULL';
                                 } else {
                                    cellValue = String(cellValue);
                                 }
                                 resultsHtml += `<td>${cellValue}</td>`;
                             }
                         }
                         resultsHtml += '</tr>';
                     });
                     resultsHtml += '</tbody></table>';
                 }

             } else {
                 resultsHtml += `<p>No se encontraron resultados para "${termino}" en la columna "${columna}".</p>`;
             }

              // --- RE-Generar las opciones del select para que aparezcan seleccionadas después de la búsqueda ---
              const getColumnsQuery = `
                  SELECT COLUMN_NAME
                  FROM INFORMATION_SCHEMA.COLUMNS
                  WHERE TABLE_NAME = 'Tabla'
                  AND COLUMN_NAME IN ('NIS', 'DIRECCION', 'SERIE_MEDIDOR')
                  ORDER BY ORDINAL_POSITION
              `;
               // Vuelve a ejecutar la consulta de columnas o reutiliza un resultado cacheado si lo implementas
               const columnsResultForPost = await app.locals.db.request().query(getColumnsQuery);
               const columnNamesForPost = columnsResultForPost.recordset.map(row => row.COLUMN_NAME);

              let optionsHtmlForPost = '<option value="">-- Seleccione una columna --</option>';
              columnNamesForPost.forEach(colName => {
                  // Marca como 'selected' la opción que fue seleccionada por el usuario
                  const selectedAttr = (colName === columna) ? 'selected' : '';
                  optionsHtmlForPost += `<option value="${colName}" ${selectedAttr}>${colName}</option>`;
              });
             // --- FIN RE-Generar opciones ---


             // Envía la página completa de vuelta con los resultados insertados y el formulario lleno
             res.send(`
                 <!DOCTYPE html>
                 <html>
                 <head>
                     <title>Buscar en la Tabla (Node.js)</title>
                      <link rel="stylesheet" href="/styles.css">
                     <style><link rel="stylesheet" href="/styles.css"></style>
                     <script>
                         function clearFormAndResults() {
                             document.getElementById("searchForm").reset();
                             const resultsArea = document.getElementById("resultsArea");
                             if (resultsArea) {
                                 resultsArea.classList.remove("visible");
                             }
                             // window.location.href = window.location.pathname;
                         }
                     </script>
                 </head>
                 <body>
                     <h1>Buscar en la Tabla (Node.js)</h1>
                     <form action="/buscar" method="post" id="searchForm">
                         <label for="columna">Seleccionar Columna:</label>
                         <select name="columna" id="columna" required>
                              ${optionsHtmlForPost} </select>
                         <br><br>
                         <label for="termino">Término de Búsqueda:</label>
                         <input type="text" name="termino" id="termino" value="${termino}" required> <br><br>
                         <button type="submit">Buscar</button>
                          <button type="button" onclick="clearFormAndResults()">Limpiar</button>
                     </form>
                     <hr>
                     <div id="resultsArea" class="results-area visible"> ${resultsHtml}
                     </div>
                 </body>
                 </html>
             `);


         } catch (err) {
             console.error('Error al ejecutar la consulta:', err);
             res.status(500).send('Error al realizar la búsqueda.');
         }
    });

    // ... (otras rutas si las hay, como el login en la Fase 3)
        // Ruta para mostrar el formulario de login
        app.get('/login', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Login</title>
                    <style><link rel="stylesheet" href="/styles.css"></style> <style>
                        /* Puedes añadir estilos específicos para el formulario de login */
                        .login-container {
                             width: 300px;
                             margin: 50px auto;
                             padding: 20px;
                             border: 1px solid #ccc;
                             border-radius: 5px;
                             box-shadow: 2px 2px 12px #aaa;
                        }
                        .login-container label,
                        .login-container input[type="text"],
                        .login-container input[type="password"] {
                             display: block;
                             width: 100%;
                             margin-bottom: 10px;
                        }
                        .login-container input[type="submit"] {
                            width: auto;
                            padding: 8px 15px;
                            background-color: #007bff;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        }
                         .login-container input[type="submit"]:hover {
                             background-color: #0056b3;
                         }
                         .error-message {
                             color: red;
                             margin-top: 10px;
                         }
                     </style>
                </head>
                <body>
                    <div class="login-container">
                        <h1>Iniciar Sesión</h1>
                        <form action="/login" method="post">
                            <div>
                                <label for="username">Usuario:</label>
                                <input type="text" id="username" name="username" required>
                            </div>
                            <div>
                                <label for="password">Contraseña:</label>
                                <input type="password" id="password" name="password" required>
                            </div>
                            <div>
                                <input type="submit" value="Entrar">
                            </div>
                        </form>
                         <div id="messageArea">
                             </div>
                    </div>
                </body>
                </html>
            `);
        });
    
        // Ruta para procesar el login
        app.post('/login', async (req, res) => {
            const { username, password } = req.body; // Obtiene usuario y contraseña del formulario
    
            // --- ADVERTENCIA DE SEGURIDAD CRÍTICA ---
            // ESTE ES UN EJEMPLO BÁSICO ALMACENANDO CONTRASEÑAS EN TEXTO PLANO.
            // EN UNA APLICACIÓN REAL, NUNCA DEBES HACER ESTO.
            // DEBES ALMACENAR HASHES DE CONTRASEÑAS (usando bcrypt, argon2, etc.)
            // Y COMPARAR EL HASH DE LA CONTRASEÑA INGRESADA CON EL HASH ALMACENADO.
            // --- FIN ADVERTENCIA ---
    
            try {
                const request = app.locals.db.request(); // Obtiene una solicitud
    
                // Consulta SQL para verificar el usuario y la contraseña
                // ¡¡¡USANDO PARAMETRIZACIÓN PARA EVITAR INYECCIÓN SQL!!!
                const loginQuery = `
                    SELECT Id, NombreUsuario
                    FROM Usuarios
                    WHERE NombreUsuario = @username AND Contrasena = @password
                `;
    
                // Añade los parámetros para el nombre de usuario y la contraseña
                request.input('username', mssql.VarChar, username);
                request.input('password', mssql.VarChar, password); // ¡Parametrizando la contraseña (texto plano)!
    
                const result = await request.query(loginQuery);
    
                let message = '';
                if (result.recordset.length > 0) {
                    // Usuario encontrado, credenciales correctas
                    const user = result.recordset[0];
                    console.log(`Login exitoso para el usuario: ${user.NombreUsuario}`);
                    message = `<p style="color: green;">Login exitoso. ¡Bienvenido, ${user.NombreUsuario}!</p>`;
                    // En una aplicación real, aquí iniciarías una sesión (con cookies, tokens, etc.)
                    // y redirigirías al usuario a una página privada.
                } else {
                    // Usuario no encontrado o contraseña incorrecta
                    console.log(`Intento de login fallido para el usuario: ${username}`);
                     message = `<p style="color: red;">Usuario o contraseña incorrectos.</p>`;
                }
    
                // --- Renderizar la página de login de nuevo con el mensaje ---
                 // Necesitamos volver a mostrar el formulario, pero ahora con un mensaje
                res.send(`
                     <!DOCTYPE html>
                     <html>
                     <head>
                         <title>Login</title>
                         <style><link rel="stylesheet" href="/styles.css"></style>
                          <style>
                             .login-container {
                                  width: 300px;
                                  margin: 50px auto;
                                  padding: 20px;
                                  border: 1px solid #ccc;
                                  border-radius: 5px;
                                  box-shadow: 2px 2px 12px #aaa;
                             }
                             .login-container label,
                             .login-container input[type="text"],
                             .login-container input[type="password"] {
                                  display: block;
                                  width: 100%;
                                  margin-bottom: 10px;
                             }
                             .login-container input[type="submit"] {
                                 width: auto;
                                 padding: 8px 15px;
                                 background-color: #007bff;
                                 color: white;
                                 border: none;
                                 border-radius: 4px;
                                 cursor: pointer;
                             }
                              .login-container input[type="submit"]:hover {
                                  background-color: #0056b3;
                              }
                              .error-message {
                                  color: red;
                                  margin-top: 10px;
                              }
                          </style>
                     </head>
                     <body>
                         <div class="login-container">
                             <h1>Iniciar Sesión</h1>
                             <form action="/login" method="post">
                                 <div>
                                     <label for="username">Usuario:</label>
                                     <input type="text" id="username" name="username" required value="${username}"> </div>
                                 <div>
                                     <label for="password">Contraseña:</label>
                                     <input type="password" id="password" name="password" required>
                                 </div>
                                 <div>
                                     <input type="submit" value="Entrar">
                                 </div>
                             </form>
                              <div id="messageArea">
                                  ${message} </div>
                         </div>
                     </body>
                     </html>
                `);
                // --- Fin Renderizar ---
    
    
            } catch (err) {
                console.error('Error al procesar el login:', err);
                res.status(500).send('Error interno al intentar iniciar sesión.');
            }
        });   
}

  
;