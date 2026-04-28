// routes/search.js

const express = require('express');
const router = express.Router(); // Crea un objeto router para este módulo
const mssql = require('mssql'); // Necesario para interactuar con la DB

// Las rutas definidas aquí se montarán en app.js
// La ruta GET '/' se convierte en la página principal con el formulario de búsqueda.
router.get('/', async (req, res) => {
    // *** Nota: La protección de rutas (middleware) se aplicará en app.js en un bloque posterior ***
    // Por ahora, esta ruta puede ser accedida sin login (temporalmente para probar la modularización)
    // if (!req.session.isLoggedIn) { return res.redirect('/auth/login'); } // Esto se activará después del Bloque 6

    try {
        const request = req.app.locals.db.request(); // Accede al pool de la DB via app.locals

        // Consulta para obtener nombres de columna
        const getColumnsQuery = `
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Tabla'
            AND COLUMN_NAME IN ('NIS', 'DIRECCION', 'SERIE_MEDIDOR')
            ORDER BY ORDINAL_POSITION
        `;
        const result = await request.query(getColumnsQuery);
        const columnNames = result.recordset.map(row => row.COLUMN_NAME);

        // *** Renderiza la plantilla 'search.ejs' ***
        // Le pasamos los datos que la plantilla espera (columnNames, y datos de búsqueda inicial vacíos)
        res.render('search', {
            columnNames: columnNames,
            resultsHtml: '', // No hay resultados al cargar la página inicialmente
            searchTermValue: '', // Campo de búsqueda vacío inicialmente
            selectedColumn: ''   // Opción del select sin seleccionar inicialmente
        });

    } catch (err) {
        console.error('Error al obtener nombres de columna (GET /):', err);
        // En caso de error DB, renderiza la página con un mensaje
        res.status(500).render('search', {
             columnNames: [], // Pasar un array vacío si no se pudieron obtener
             resultsHtml: '<p style="color: red;">Error al cargar los nombres de columna.</p>',
             searchTermValue: '',
             selectedColumn: ''
        });
    }
});


// La ruta POST '/buscar' para procesar la búsqueda
router.post('/buscar', async (req, res) => {
     // *** Nota: La protección de rutas (middleware) se aplicará en app.js en un bloque posterior ***
     // if (!req.session.isLoggedIn) { return res.redirect('/auth/login'); } // Esto se activará después del Bloque 6

    const { columna, termino } = req.body;
    let resultsHtml = ''; // Para almacenar el HTML de los resultados o mensajes

    const allowedColumns = ['NIS', 'DIRECCION', 'SERIE_MEDIDOR'];
    if (!allowedColumns.includes(columna)) {
         // Si la columna no es válida, preparamos un mensaje de error
         resultsHtml = '<p style="color: red;">Columna de búsqueda seleccionada no válida.</p>';
          // No es necesario consultar la DB en este caso, pero necesitamos las columnas para renderizar el select
         const request = req.app.locals.db.request();
         const getColumnsQuery = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Tabla' AND COLUMN_NAME IN ('NIS', 'DIRECCION', 'SERIE_MEDIDOR') ORDER BY ORDINAL_POSITION`;
         const result = await request.query(getColumnsQuery);
         const columnNames = result.recordset.map(row => row.COLUMN_NAME);

         // *** Renderiza la plantilla 'search.ejs' con el mensaje de error ***
         return res.status(400).render('search', { // Usar status 400 para Bad Request
              columnNames: columnNames,
              resultsHtml: resultsHtml, // Pasa el mensaje de error
              searchTermValue: termino, // Mantén el término buscado
              selectedColumn: columna   // Mantén la columna seleccionada
         });
    }

    const searchTerm = `%${termino}%`;

    try {
        const request = req.app.locals.db.request();

        // Consulta SQL de búsqueda (parametrizada)
        const query = `SELECT * FROM Tabla WHERE ${columna} LIKE @searchTerm`;
        request.input('searchTerm', mssql.NVarChar, searchTerm);

        const result = await request.query(query);

        if (result.recordset.length > 0) {
             // --- Construir el HTML de la tabla de resultados (igual que antes) ---
             // Este código genera un string HTML que pasaremos a la plantilla.
             if (result.recordset.length === 1) {
                resultsHtml += '<h3>Detalle del Registro Encontrado</h3>';
                resultsHtml += '<table border="1" class="transposed-table">';
                resultsHtml += '<thead><tr><th>Columna</th><th>Valor</th></tr></thead><tbody>';
                const record = result.recordset[0];
                for (const colName in record) {
                     if (Object.hasOwnProperty.call(record, colName)) {
                          let cellValue = record[colName];
                          // --- Formateo de fecha y null ---
                          if (cellValue instanceof Date) {
                              // Formatea la fecha a un string legible
                              cellValue = cellValue.toISOString().slice(0, 19).replace('T', ' ');
                          } else if (cellValue === null) {
                             cellValue = 'NULL'; // Muestra 'NULL' para valores nulos
                          } else {
                             cellValue = String(cellValue); // Asegura que otros valores sean strings
                          }
                          resultsHtml += `<tr><td>${colName}</td><td>${cellValue}</td></tr>`;
                     }
                }
                resultsHtml += '</tbody></table>';

             } else {
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
             // --- Fin Construir HTML de la tabla ---

        } else {
            // Mensaje si no se encontraron resultados
            resultsHtml = `<p>No se encontraron resultados para "${termino}" en la columna "${columna}".</p>`; // <-- ¡Usa esta línea EXACTA!
        }

        // Siempre necesitamos los nombres de columna para renderizar el select después de la búsqueda
        const getColumnsQuery = `
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Tabla'
            AND COLUMN_NAME IN ('NIS', 'DIRECCION', 'SERIE_MEDIDOR')
            ORDER BY ORDINAL_POSITION
        `;
        const columnsResultForPost = await req.app.locals.db.request().query(getColumnsQuery);
        const columnNamesForPost = columnsResultForPost.recordset.map(row => row.COLUMN_NAME);


        // *** Renderiza la plantilla 'search.ejs' y le pasa todos los datos necesarios ***
        res.render('search', {
            columnNames: columnNamesForPost, // Nombres de columna para el select
            resultsHtml: resultsHtml,       // HTML de los resultados o mensaje
            searchTermValue: termino,       // El término que el usuario buscó (para mantenerlo en el input)
            selectedColumn: columna         // La columna que el usuario seleccionó (para mantenerla en el select)
        });


    } catch (err) {
        console.error('Error al ejecutar la consulta (POST /buscar):', err);
        // En caso de error DB, también renderiza la página con un mensaje de error
         const request = req.app.locals.db.request();
         const getColumnsQuery = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Tabla' AND COLUMN_NAME IN ('NIS', 'DIRECCION', 'SERIE_MEDIDOR') ORDER BY ORDINAL_POSITION`;
         const result = await request.query(getColumnsQuery);
         const columnNames = result.recordset.map(row => row.COLUMN_NAME);
        res.status(500).render('search', { // Usar status 500 para Error Interno del Servidor
            columnNames: columnNames,
            resultsHtml: '<p style="color: red;">Error al realizar la búsqueda.</p>',
            searchTermValue: termino,
            selectedColumn: columna
        });
    }
});


// Exporta el router para que app.js pueda importarlo y usarlo
module.exports = router;