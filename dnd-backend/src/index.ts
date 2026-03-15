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

// WebSocket logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room (mesa)
  socket.on('join_mesa', (salaId) => {
    socket.join(`mesa_${salaId}`);
    console.log(`Socket ${socket.id} joined mesa_${salaId}`);
  });

  // Handle dice rolls
  socket.on('roll_dice', (data) => {
    const { salaId, roll } = data;
    console.log(`Roll in mesa_${salaId}:`, roll);
    io.to(`mesa_${salaId}`).emit('dice_event', roll);
  });

  // Handle HP updates in real-time
  socket.on('update_hp', (data) => {
    const { salaId, charId, hp_current } = data;
    console.log(`HP Update in mesa_${salaId}: ${charId} -> ${hp_current}`);
    socket.to(`mesa_${salaId}`).emit('hp_sync', { charId, hp_current });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
