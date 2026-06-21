import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import Message from './models/Message.js';
import Exam from './models/Exam.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 5000;


// Sign Up Route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, userId, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ userId }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User ID or Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      username,
      userId,
      email,
      password: hashedPassword,
      course: 'default'
    });

    const createdUser = await newUser.save();

    // Automatically create the initial chat entry for the new user
    const chatData = await User.createChatSession(createdUser.id);

    res.status(201).json({ 
      message: 'User created successfully', 
      user: { 
        id: createdUser.id,
        username, 
        userId, 
        email,
        chat_id: chatData.chat_id 
      } 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sign In Route
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { userId, password } = req.body;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(400).json({ message: 'Invalid User ID' });
    }

    // --- Secure Password Verification with Legacy Support ---
    let isPasswordValid = false;
    let needsUpgrade = false;

    try {
      // 1. Try BCrypt comparison (for new/upgraded accounts)
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (e) {
      // If user.password is not a valid hash (legacy), bcrypt might throw or return false
      isPasswordValid = false;
    }

    // 2. Fallback to plain-text check (for legacy accounts)
    if (!isPasswordValid && user.password === password) {
      isPasswordValid = true;
      needsUpgrade = true;
      console.log(`[AUTH] Legacy account detected for ${userId}. Upgrading to hash...`);
    }

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid Password' });
    }

    // 3. Auto-upgrade legacy plain-text passwords to hashes
    if (needsUpgrade) {
      const newHash = await bcrypt.hash(password, 10);
      try {
        await User.supabase
          .from('users_data')
          .update({ password: newHash })
          .eq('id', user.id);
        console.log(`[AUTH] Successfully upgraded ${userId} to secure hashing.`);
      } catch (err) {
        console.error(`[AUTH ERROR] Failed to upgrade password for ${userId}:`, err);
      }
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ message: 'You are Not Active' });
    }

    // Update last_login timestamp in Supabase
    await User.updateLastLogin(user.id);

    // Fetch the user's chat_id during login to return it to the frontend
    const { data: chatData, error: chatError } = await User.supabase
      .from('chat_data')
      .select('chat_id')
      .eq('user_id', user.id)
      .maybeSingle();

    res.status(200).json({ 
      message: 'Login successful',
      user: { 
        id: user.id,
        username: user.username, 
        userId: user.userId, 
        email: user.email,
        chat_id: chatData ? chatData.chat_id : null
      } 
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check User ID availability
app.get('/api/auth/check-userid/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    console.log(`[AUTH] UserID Check: ${req.params.userId} -> ${!user ? 'Available' : 'Taken'}`);
    res.json({ available: !user });
  } catch (err) {
    console.error('[AUTH ERROR] UserID Check:', err.message);
    res.status(500).json({ error: 'Server error', available: true });
  }
});

// Check Email availability
app.get('/api/auth/check-email/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    console.log(`[AUTH] Email Check: ${req.params.email} -> ${!user ? 'Available' : 'Taken'}`);
    res.json({ available: !user });
  } catch (err) {
    console.error('[AUTH ERROR] Email Check:', err.message);
    res.status(500).json({ error: 'Server error', available: true });
  }
});

// --- Chat History Routes ---

// Fetch all messages for a specific session (Main Chat Area)
app.get('/api/chat/history/:sessionId', async (req, res) => {
  try {
    const sessionData = await Message.getHistory(req.params.sessionId);
    res.json({ history: sessionData.content, chat_type: sessionData.type });
  } catch (error) {
    console.error('[CHAT ERROR] Get History:', error.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Rename a chat session (POST for best compatibility)
app.post('/api/chat/rename', async (req, res) => {
  try {
    const { sessionId, title } = req.body;
    const { data: updated, error } = await User.supabase
      .from('chat_messages')
      .update({ chat_title: title })
      .eq('id', sessionId)
      .select('id, chat_title');

    if (error) throw error;
    res.json({ success: true, updated: updated[0] });
  } catch (error) {
    console.error('[CHAT ERROR] Rename:', error.message);
    res.status(500).json({ error: 'Failed to rename chat.' });
  }
});

// Delete a chat session
app.delete('/api/chat/:sessionId', async (req, res) => {
  try {
    const { error } = await User.supabase
      .from('chat_messages')
      .delete()
      .eq('id', req.params.sessionId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('[CHAT ERROR] Delete:', error.message);
    res.status(500).json({ error: 'Failed to delete chat.' });
  }
});

// Fetch latest chat session list for the sidebar
app.get('/api/chat/list/:userId', async (req, res) => {
  try {
    const { data: chats, error } = await User.supabase
      .from('chat_messages')
      .select(`
        id,
        chat_title,
        chat_type,
        created_at,
        chat_data!inner(user_id)
      `)
      .eq('chat_data.user_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) {
        // Fallback if chat_title is missing
        if (error.message.includes('chat_title')) {
             const { data: fallback, error: fallError } = await User.supabase
              .from('chat_messages')
              .select(`id, created_at, chat_type, chat_data!inner(user_id)`)
              .eq('chat_data.user_id', req.params.userId)
              .order('created_at', { ascending: false });
             
             if (fallError) throw fallError;
             
             return res.json({ chats: fallback.map((c, index) => ({
                id: c.id,
                session_id: c.id,
                title: `Chat ${fallback.length - index}`,
                created_at: c.created_at
             })) });
        }
        throw error;
    }

    res.json({ chats: chats.map((c, index) => ({
        id: c.id,
        session_id: c.id,
        title: c.chat_title || `Chat ${chats.length - index}`,
        created_at: c.created_at,
        chat_type: c.chat_type
    })) });
  } catch (error) {
    console.error('[CHAT ERROR] Get List:', error.message);
    res.status(500).json({ error: 'Failed to fetch chat list' });
  }
});

// Save a message into an existing session row
app.post('/api/chat/message-save', async (req, res) => {
  try {
    const { sessionId, query, response, tokens } = req.body;
    
    const message = await Message.save(
        sessionId, 
        { query, response }, 
        tokens || {}
    );
    res.status(201).json({ message });
  } catch (error) {
    console.error('[CHAT ERROR] Save Message:', error.message);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Create a brand new session entry in chat_messages
app.post('/api/chat/new', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // 1. Get the user's root chat_id from chat_data
    let { data: chatData, error: dataError } = await User.supabase
        .from('chat_data')
        .select('chat_id')
        .eq('user_id', userId)
        .maybeSingle();
    
    if (dataError) throw dataError;

    // If no chat_data row exists for this user, create one on the fly!
    if (!chatData) {
        console.log(`[CHAT] No chat_data found for user ${userId}. Creating one on the fly...`);
        chatData = await User.createChatSession(userId);
    }

    // 2. Create the row in chat_messages (removed chat_title column)
    const { data: newSession, error: sessionError } = await User.supabase
        .from('chat_messages')
        .insert([{
            session_id: chatData.chat_id,
            content: [] 
        }])
        .select()
        .single();

    if (sessionError) throw sessionError;

    res.status(201).json({ chat: { ...newSession, chat_id: newSession.id } });
  } catch (error) {
    console.error('[CHAT ERROR] New Session:', error.message);
    res.status(500).json({ error: 'Failed to create new session' });
  }
});

// Fetch total tokens consumed by user
app.get('/api/user/usage/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // 1. Get the user's root chat_id and total_token
    const { data: chatData, error: chatError } = await User.supabase
      .from('chat_data')
      .select('chat_id, total_tokens')
      .eq('user_id', userId)
      .maybeSingle();

    if (chatError || !chatData) {
      return res.json({ total_token: 0 });
    }

    res.json({ total_token: chatData.total_tokens || 0 });
  } catch (error) {
    console.error('[USAGE ERROR] Get Total Tokens:', error.message);
    res.status(500).json({ error: 'Failed to fetch token usage' });
  }
});

// Fetch user activity for dashboard
app.get('/api/user/activity/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // 1. Get the user's root chat_id
    const { data: chatData, error: chatError } = await User.supabase
      .from('chat_data')
      .select('chat_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (chatError || !chatData) {
      return res.json({ activity: [] });
    }

    // 2. Fetch all created_at timestamps and detailed token consumption
    const { data: msgData, error: msgError } = await User.supabase
      .from('chat_messages')
      .select('created_at, total_tokens, input_tokens, output_tokens, chat_type')
      .eq('session_id', chatData.chat_id)
      .order('created_at', { ascending: true });

    if (msgError) {
      throw msgError;
    }

    // Map the database total_tokens to total_token for the UI
    const mappedActivity = (msgData || []).map(row => ({
      ...row,
      total_token: row.total_tokens
    }));

    res.json({ activity: mappedActivity });
  } catch (error) {
    console.error('[ACTIVITY ERROR] Get User Activity:', error.message);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// --- Exam Routes ---
app.post('/api/exam/save', async (req, res) => {
  try {
    const { user_id, subject, chapter, data, input_token, output_token, total_token, evolve_comment, chat_type, chat_title } = req.body;
    
    // 1. Get the user's root chat_id from chat_data
    let { data: chatData, error: dataError } = await User.supabase
        .from('chat_data')
        .select('chat_id')
        .eq('user_id', user_id)
        .maybeSingle();
    
    if (dataError) throw dataError;

    // If no chat_data row exists for this user, create one on the fly!
    if (!chatData) {
        chatData = await User.createChatSession(user_id);
    }

    // 2. Insert into chat_messages
    const { data: newSession, error: sessionError } = await User.supabase
        .from('chat_messages')
        .insert([{
            session_id: chatData.chat_id,
            chat_type: chat_type || 'exam',
            chat_title: chat_title || `${subject} - ${chapter} Exam`,
            content: { ...data, performance: evolve_comment?.performance },
            input_tokens: input_token || 0,
            output_tokens: output_token || 0,
            total_tokens: total_token || 0,
        }])
        .select()
        .single();

    if (sessionError) throw sessionError;

    res.status(201).json({ success: true, exam: newSession });
  } catch (error) {
    console.error('[EXAM ERROR] Save Exam:', error.message);
    res.status(500).json({ error: 'Failed to save exam data.' });
  }
});

// Serve local PDF books static route
app.use('/api/books', express.static('C:/Projects/evolve-gm/utils/books'));

// --- Learn Mode Bridge/Proxy Endpoints ---
app.post('/api/learn/generate', async (req, res) => {
  try {
    const pythonUrl = process.env.PYTHON_LLM_URL || 'http://127.0.0.1:8000';
    console.log(`[BRIDGE] Proxying /api/learn/generate request to ${pythonUrl}`);
    const response = await fetch(`${pythonUrl}/api/learn/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BRIDGE ERROR] Python response error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: `Python service error: ${response.status}` });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('[BRIDGE ERROR] Learn Generate:', error.message);
    res.status(500).json({ error: 'Failed to communicate with the LLM service.' });
  }
});

app.post('/api/learn/explain-section', async (req, res) => {
  try {
    const pythonUrl = process.env.PYTHON_LLM_URL || 'http://127.0.0.1:8000';
    console.log(`[BRIDGE] Proxying /api/learn/explain-section request to ${pythonUrl}`);
    const response = await fetch(`${pythonUrl}/api/learn/explain-section`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BRIDGE ERROR] Python response error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: `Python service error: ${response.status}` });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('[BRIDGE ERROR] Learn Explain Section:', error.message);
    res.status(500).json({ error: 'Failed to communicate with the LLM service.' });
  }
});

app.post('/api/learn/doubt', async (req, res) => {
  try {
    const pythonUrl = process.env.PYTHON_LLM_URL || 'http://127.0.0.1:8000';
    console.log(`[BRIDGE] Proxying /api/learn/doubt request to ${pythonUrl}`);
    const response = await fetch(`${pythonUrl}/api/learn/doubt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BRIDGE ERROR] Python response error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: `Python service error: ${response.status}` });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('[BRIDGE ERROR] Learn Doubt:', error.message);
    res.status(500).json({ error: 'Failed to communicate with the LLM service.' });
  }
});

// Allow local development to listen on a port
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
