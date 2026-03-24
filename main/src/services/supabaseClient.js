import { createClient } from '@supabase/supabase-js';

// Cấu hình Supabase - Sử dụng biến môi trường
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Kiểm tra các biến môi trường bắt buộc
if (!supabaseUrl || !supabaseKey) {
  console.error('🚨 Missing Supabase environment variables!');
  console.error('- REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('- REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  throw new Error('Supabase configuration is incomplete. Please check your .env file.');
}

// Cấu hình options cho Supabase client
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'cinemahub-auth-token'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  },
  global: {
    headers: {
      'x-client-info': `cinemahub-web@${process.env.REACT_APP_VERSION || '1.0.0'}`
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, supabaseOptions);

// Log thông tin cấu hình (an toàn)
console.log('🔧 Supabase client initialized:', {
  url: supabaseUrl,
  keyPreview: supabaseKey.substring(0, 20) + '...',
  environment: process.env.REACT_APP_ENV || 'production',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  debug: process.env.REACT_APP_DEBUG === 'true'
});

// Database table names
export const TABLES = {
  MOVIES: 'movies',
  SHOWTIMES: 'showtimes',
  BOOKINGS: 'bookings',
  BOOKING_SEATS: 'booking_seats',
  SEATS: 'seats',
  USERS: 'users',
  NEWS: 'news',
  PROMOTIONS: 'promotions'
};

// Helper functions for common operations
export const supabaseHelpers = {
  // Check if user is authenticated
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Sign in with email and password
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign up new user
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Generic CRUD operations
  async create(table, data) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
    return { data: result, error };
  },

  async read(table, filters = {}, orderBy = 'created_at') {
    let query = supabase.from(table).select('*');
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    // Apply ordering
    query = query.order(orderBy, { ascending: false });
    
    const { data, error } = await query;
    return { data, error };
  },

  async update(table, id, data) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();
    return { data: result, error };
  },

  async delete(table, id) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    return { data, error };
  }
};