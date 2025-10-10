const config = require('../config/app');

/**
 * HTML templates module
 * Contains all HTML template functions
 */

/**
 * Generate login page HTML
 * @param {string} error - Error message to display
 * @returns {string} HTML content
 */
function loginTemplate(error = '') {
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login - Proyecto Nikolito</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 400px; margin: 100px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                h2 { text-align: center; color: #333; margin-bottom: 30px; }
                .form-group { margin-bottom: 20px; }
                label { display: block; margin-bottom: 5px; color: #555; }
                input[type="text"], input[type="password"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
                .btn { width: 100%; padding: 12px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
                .btn:hover { background-color: #0056b3; }
                .btn-clear { background-color: #6c757d; margin-top: 10px; }
                .btn-clear:hover { background-color: #545b62; }
                .error { color: #dc3545; text-align: center; margin-top: 15px; }
                .info { color: #17a2b8; text-align: center; margin-bottom: 20px; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>🔐 Acceso al Sistema</h2>
                <div class="info">
                    <strong>Usuarios de prueba:</strong><br>
                    ${config.testUsers.map(user => `${user.username} / ${user.password}`).join('<br>')}
                </div>
                <form method="POST" action="/login">
                    <div class="form-group">
                        <label for="usuario">Usuario:</label>
                        <input type="text" id="usuario" name="usuario" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Contraseña:</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit" class="btn">Iniciar Sesión</button>
                    <button type="button" class="btn btn-clear" onclick="limpiarFormulario()">Limpiar</button>
                </form>
                ${error ? `<div class="error">${error}</div>` : ''}
            </div>
            <script>
                function limpiarFormulario() {
                    document.getElementById('usuario').value = '';
                    document.getElementById('password').value = '';
                    document.getElementById('usuario').focus();
                }
            </script>
        </body>
        </html>
    `;
}

/**
 * Generate dashboard page HTML
 * @param {string} usuario - Username to display
 * @returns {string} HTML content
 */
function dashboardTemplate(usuario = 'Usuario') {
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard - Proyecto Nikolito</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px; }
                .header { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
                .container { max-width: 1200px; margin: 0 auto; }
                .welcome { color: #333; }
                .logout-btn { background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                .logout-btn:hover { background-color: #c82333; }
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center; }
                .stat-number { font-size: 2em; font-weight: bold; color: #007bff; }
                .search-section { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }

                /* Mobile styles */
                @media (max-width: 768px) {
                    .container { padding: 10px; }
                    .header { flex-direction: column; gap: 10px; text-align: center; }
                    .search-section { padding: 15px; }
                    .stats { grid-template-columns: 1fr; }
                    .stat-number { font-size: 1.5em; }
                }

                /* Improve mobile scrolling */
                .table-container {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: thin;
                    scrollbar-color: #007bff #f1f1f1;
                }

                .table-container::-webkit-scrollbar {
                    height: 8px;
                }

                .table-container::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }

                .table-container::-webkit-scrollbar-thumb {
                    background: #007bff;
                    border-radius: 4px;
                }

                .table-container::-webkit-scrollbar-thumb:hover {
                    background: #0056b3;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="welcome">👋 Bienvenido, ${usuario}!</h1>
                    <a href="/logout" class="logout-btn">Cerrar Sesión</a>
                </div>

                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-number">68,031</div>
                        <div>Total de Registros</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">5</div>
                        <div>Comunas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">100%</div>
                        <div>Datos Importados</div>
                    </div>
                </div>

                <div class="search-section">
                    <h2>🔍 Buscador de Datos</h2>
                    <p><strong>Buscar en:</strong> Dirección, NIS, Consecutivo o Serie del Medidor</p>

                    <form id="searchForm" style="margin-bottom: 20px;">
                        <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                            <input type="text" id="searchValue" placeholder="Ingresa el valor a buscar..."
                                   style="flex: 1; min-width: 200px; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px;">
                            <select id="searchField" style="padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; min-width: 140px;">
                                <option value="direccion">📍 Dirección</option>
                                <option value="nis">🔢 NIS</option>
                                <option value="consecutive">📋 Consecutivo</option>
                                <option value="serie_medidor">⚡ Serie Medidor</option>
                            </select>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button type="submit" style="flex: 1; min-width: 120px; padding: 12px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                                🔍 Buscar
                            </button>
                            <button type="button" id="clearBtn" style="flex: 1; min-width: 120px; padding: 12px 20px; background-color: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                                🧹 Limpiar
                            </button>
                        </div>
                    </form>

                    <div id="searchResults" style="margin-top: 20px;">
                        <p style="color: #666; font-style: italic;">Ingresa un valor y selecciona el campo para buscar.</p>
                    </div>
                </div>

            </div>

            <script>
                ${getDashboardScript()}
            </script>
        </body>
        </html>
    `;
}

/**
 * Get dashboard JavaScript code
 * @returns {string} JavaScript code
 */
function getDashboardScript() {
    return `
                document.getElementById('searchForm').addEventListener('submit', async function(e) {
                    e.preventDefault();

                    const valor = document.getElementById('searchValue').value.trim();
                    const campo = document.getElementById('searchField').value;

                    if (!valor) {
                        alert('Por favor ingresa un valor para buscar');
                        return;
                    }

                    const resultsDiv = document.getElementById('searchResults');
                    resultsDiv.innerHTML = '<p>🔍 Buscando...</p>';

                    try {
                        const response = await fetch('/api/buscar', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ valor, campo })
                        });

                        const data = await response.json();

                        if (data.error) {
                            resultsDiv.innerHTML = '<p style="color: red;">❌ Error: ' + data.error + '</p>';
                            return;
                        }

                        if (data.resultados.length === 0) {
                            resultsDiv.innerHTML = '<p style="color: orange;">⚠️ No se encontraron resultados para "' + valor + '" en ' + campo + '</p>';
                            return;
                        }

                        // If exactly 1 result, show transposed
                        if (data.resultados.length === 1) {
                            const registro = data.resultados[0];
                            let html = '<h3>✅ Resultado encontrado (1 registro)</h3>';
                            html += '<div class="table-container">';
                            html += '<table style="width: 100%; border-collapse: collapse; background: white;">';

                            Object.keys(registro).forEach(key => {
                                const valor = registro[key] || '';
                                html += '<tr style="border-bottom: 1px solid #ddd;">';
                                html += '<td style="padding: 8px; font-weight: bold; background: #f8f9fa; width: 200px;">' + key.toUpperCase() + '</td>';
                                html += '<td style="padding: 8px;">' + valor + '</td>';
                                html += '</tr>';
                            });

                            html += '</table></div>';
                            resultsDiv.innerHTML = html;
                        } else {
                            // Multiple results - normal table
                            let html = '<h3>✅ Resultados encontrados (' + data.resultados.length + ' registros)</h3>';
                            html += '<div class="table-container">';
                            html += '<table style="width: 100%; border-collapse: collapse; background: white; min-width: 800px;">';

                            // Headers
                            html += '<thead><tr style="background: #007bff; color: white;">';
                            Object.keys(data.resultados[0]).forEach(key => {
                                html += '<th style="padding: 10px; text-align: left; white-space: nowrap;">' + key.toUpperCase() + '</th>';
                            });
                            html += '</tr></thead>';

                            // Rows
                            html += '<tbody>';
                            data.resultados.forEach((registro, index) => {
                                html += '<tr style="' + (index % 2 === 0 ? 'background: #f8f9fa;' : '') + '">';
                                Object.values(registro).forEach(valor => {
                                    html += '<td style="padding: 8px; border-bottom: 1px solid #ddd; white-space: nowrap;">' + (valor || '') + '</td>';
                                });
                                html += '</tr>';
                            });
                            html += '</tbody></table></div>';

                            resultsDiv.innerHTML = html;
                        }

                    } catch (error) {
                        console.error('Error:', error);
                        resultsDiv.innerHTML = '<p style="color: red;">❌ Error de conexión</p>';
                    }
                });

                document.getElementById('clearBtn').addEventListener('click', function() {
                    document.getElementById('searchValue').value = '';
                    document.getElementById('searchField').value = 'direccion';
                    document.getElementById('searchResults').innerHTML = '<p style="color: #666; font-style: italic;">Ingresa un valor y selecciona el campo para buscar.</p>';
                    document.getElementById('searchValue').focus();
                });
    `;
}

module.exports = {
    loginTemplate,
    dashboardTemplate
};
