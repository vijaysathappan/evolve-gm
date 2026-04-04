import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import User from './models/User.js';
import Message from './models/Message.js';

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

    const newUser = new User({
      username,
      userId,
      email,
      password // In a real app, hash this password!
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

    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid Password' });
    }

    // Check if user is active before allowing login
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
      .single();

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
    const history = await Message.getHistory(req.params.sessionId);
    res.json({ history });
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
              .select(`id, created_at, chat_data!inner(user_id)`)
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
        created_at: c.created_at
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
    const { data: chatData, error: dataError } = await User.supabase
        .from('chat_data')
        .select('chat_id')
        .eq('user_id', userId)
        .single();
    
    if (dataError) throw dataError;

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

// Allow local development to listen on a port
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
