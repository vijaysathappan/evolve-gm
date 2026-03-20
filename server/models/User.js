import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default class User {
  constructor(data) {
    this.name = data.username || data.name;
    this.user_id = data.userId || data.user_id;
    this.email_id = data.email || data.email_id;
    this.password = data.password;
    this.course = data.course || 'default';
  }

  async save() {
    const { data, error } = await supabase
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
      .select();

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

    const { data, error } = await query.single();
    
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
}
