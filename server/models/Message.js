import { supabase, withRetry } from './User.js';

export default class Message {
  constructor(data) {
    this.id = data.id;
    this.session_id = data.session_id;
    this.content = data.content; // JSONB: { query, response }
    this.input_tokens = data.input_tokens || 0;
    this.output_tokens = data.output_tokens || 0;
    this.total_tokens = data.total_tokens || 0;
    this.input_cost = data.input_cost || 0;
    this.output_cost = data.output_cost || 0;
    this.total_cost = data.total_cost || 0;
    this.chat_title = data.chat_title || 'New Chat';
    this.created_at = data.created_at;
  }

  static async save(sessionId, { query, response }, tokens = {}, costs = {}, title = null) {
    // 1. Check if this specific session row already exists
    const { data: existing, error: findError } = await withRetry(() => 
      supabase
        .from('chat_messages')
        .select('id, session_id, content, total_tokens, created_at')
        .eq('id', sessionId)
        .maybeSingle()
    );

    if (existing) {
      // 2. Update existing session: Append to the content array
      const updatedContent = Array.isArray(existing.content) 
        ? [...existing.content, { query, response }] 
        : [existing.content, { query, response }];
      
      const { data: updated, error: updateError } = await withRetry(() => 
        supabase
          .from('chat_messages')
          .update({
            content: updatedContent,
            total_tokens: (existing.total_tokens || 0) + (tokens.total || 0)
          })
          .eq('id', sessionId)
          .select('id, session_id, content, total_tokens, created_at')
          .single()
      );
        
      if (updateError) throw updateError;
      return new Message(updated);
    } else {
        console.warn('Attempted to save to non-existent session ID:', sessionId);
        return null;
    }
  }

  static async getHistory(sessionId) {
    const { data, error } = await withRetry(() => 
      supabase
        .from('chat_messages')
        .select('id, session_id, content, total_tokens, created_at')
        .eq('id', sessionId)
        .single()
    );

    if (error) {
        if (error.code === 'PGRST116') return [];
        throw error;
    }
    return Array.isArray(data.content) ? data.content : [];
  }

  static async getUserChatHistory(userId) {
      // Find all sessions for user, then all messages
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
            id, session_id, content, total_tokens, created_at,
            chat_data!inner(user_id)
        `)
        .eq('chat_data.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
  }
}
