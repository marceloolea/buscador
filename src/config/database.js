const { createClient } = require('@supabase/supabase-js');

/**
 * Database configuration module
 * Handles Supabase client initialization and configuration
 */

// Supabase configuration (using environment variables in production)
const supabaseUrl = process.env.SUPABASE_URL || 'https://padhgabayahfjvuslyma.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhZGhnYWJheWFoZmp2dXNseW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzk1MjksImV4cCI6MjA3NTYxNTUyOX0.KNs9fdwVSHDu_TSW1bcvgE4FWuAf90M8xddkQULhSn8';

// Create and export Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    supabase,
    supabaseUrl,
    supabaseKey
};
