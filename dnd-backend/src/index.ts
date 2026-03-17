import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import characterRoutes from './routes/characterRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/characters', characterRoutes);

// TTS proxy – fetches audio from Google Translate and returns raw MP3
app.get('/api/tts', async (req, res) => {
  const text = req.query.text as string;
  if (!text) { res.status(400).json({ error: 'Missing text' }); return; }

  const encoded = encodeURIComponent(text);
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=pt-BR&client=gtx&ttsspeed=0.88`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
        'Accept': 'audio/mpeg, audio/*',
      }
    });

    console.log(`[TTS] Google status: ${response.status} for "${text.slice(0, 40)}"`);

    if (!response.ok) {
      res.status(502).json({ error: `Google TTS returned ${response.status}` });
      return;
    }

    const buffer = await response.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', String(buffer.byteLength));
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('[TTS] Fetch error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// WebSocket logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_mesa', (salaId) => {
    socket.join(`mesa_${salaId}`);
    console.log(`Socket ${socket.id} joined mesa_${salaId}`);
  });

  socket.on('roll_dice', (data) => {
    const { salaId, roll } = data;
    io.to(`mesa_${salaId}`).emit('dice_event', roll);
  });

  socket.on('update_hp', (data) => {
    const { salaId, charId, hp_current } = data;
    socket.to(`mesa_${salaId}`).emit('hp_sync', { charId, hp_current });
  });

  // Broadcast text to all players; each client fetches audio from /api/tts
  socket.on('play_tts', (data) => {
    const { salaId, text } = data;
    console.log(`[TTS] Broadcasting to mesa_${salaId}: ${text}`);
    io.to(`mesa_${salaId}`).emit('tts_event', { text });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
