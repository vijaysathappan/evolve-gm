import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * withRetry - A helper to catch transient network errors and retry.
 */
export async function withRetry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            const isNetworkError = err.message?.includes('fetch failed') || err.name === 'ConnectTimeoutError';
            if (isNetworkError && i < retries - 1) {
                console.warn(`[RETRY] Network error caught. Retrying (${i + 1}/${retries})...`);
                await new Promise(res => setTimeout(res, delay));
                continue;
            }
            throw err;
        }
    }
}

export default class User {
  static supabase = supabase;
  constructor(data) {
    this.name = data.username || data.name;
    this.user_id = data.userId || data.user_id;
    this.email_id = data.email || data.email_id;
    this.password = data.password;
    this.course = data.course || 'default';
  }

  async save() {
    const { data, error } = await withRetry(() => 
      supabase
        .from('users_data')
        .insert([
          { 
            name: this.name, 
            user_id: this.user_id, 
            email_id: this.email_id, 
            password: this.password,
            course: this.course 
          }
        ])
        .select()
    );

    if (error) throw error;
    return data[0];
  }

  static async findOne(queryObj) {
    let query = supabase.from('users_data').select('*');

    if (queryObj.$or) {
      const orConditions = queryObj.$or.map(cond => {
        const key = Object.keys(cond)[0];
        const val = cond[key];
        // Map common fields to supabase/schema fields
        const finalKey = key === 'userId' ? 'user_id' : (key === 'email' ? 'email_id' : key);
        return `${finalKey}.eq.${val}`;
      }).join(',');
      query = query.or(orConditions);
    } else {
      const key = Object.keys(queryObj)[0];
      const val = queryObj[key];
      // Map common fields to supabase/schema fields
      const finalKey = key === 'userId' ? 'user_id' : (key === 'email' ? 'email_id' : key);
      query = query.eq(finalKey, val);
    }

    const { data, error } = await withRetry(() => query.single());
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    // Map back to original fields for app compatibility
    if (data) {
        data.username = data.name;
        data.userId = data.user_id;
        data.email = data.email_id;
    }
    
    return data;
  }

  static async updateLastLogin(id) {
    const { error } = await withRetry(() => 
      supabase
        .from('users_data')
        .update({ last_login: new Date().toISOString() })
        .eq('id', id)
    );

    if (error) console.error('Error updating last_login:', error);
  }

  static async createChatSession(userId) {
    const { data, error } = await withRetry(() => 
      supabase
        .from('chat_data')
        .insert([{ user_id: userId }])
        .select()
        .single()
    );

    if (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
    return data;
  }
}
