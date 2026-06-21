import { supabase, withRetry } from './User.js';

export default class Exam {
  static async save(examData) {
    const { data, error } = await withRetry(() => 
      supabase
        .from('exam_data')
        .insert([examData])
        .select()
        .single()
    );

    if (error) {
      console.error('Error saving exam data:', error);
      throw error;
    }
    return data;
  }
}
