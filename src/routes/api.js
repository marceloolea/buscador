const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { buscarDatos } = require('../services/searchService');

/**
 * API routes module
 * Handles API endpoints for data operations
 */

// Search endpoint
router.post('/buscar', requireAuth, async (req, res) => {
    try {
        const { valor, campo } = req.body;

        // Search using service
        const results = await buscarDatos(valor, campo, req.userId);

        res.json(results);

    } catch (error) {
        console.error('Error en API de búsqueda:', error);
        
        // Return appropriate error response
        if (error.message === 'Valor y campo son requeridos') {
            return res.status(400).json({ error: error.message });
        }
        
        if (error.message === 'Campo no válido') {
            return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
