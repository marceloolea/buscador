const { createClient } = require('@supabase/supabase-js');

/**
 * Database configuration module
 * Handles Supabase client initialization and configuration
 */

// Supabase configuration (using environment variables in production)
const supabaseUrl = process.env.SUPABASE_URL || 'https://db.padhgabayahfjvuslyma.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWRlYnp5ZHRnamFmbWRpaHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxODM0OTIsImV4cCI6MjA2Mzc1OTQ5Mn0.c8FhzX4gQVEiq5w2Yv-JhpHmOH4_cdtKwsvotzdU198';

// Create and export Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    supabase,
    supabaseUrl,
    supabaseKey
};
