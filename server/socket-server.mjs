import { createServer } from 'node:http';
import { Server } from 'socket.io';

const port = Number.parseInt(process.env['SOCKET_PORT'] ?? '3000', 10);
const allowedOrigin = process.env['CLIENT_ORIGIN'] ?? 'http://localhost:4200';

const httpServer = createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  response.writeHead(404);
  response.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  socket.on('new-user', (user) => {
    if (!user?.id || !user?.name) {
      return;
    }

    socket.data.user = user;
    socket.broadcast.emit('new-user', user);
  });

  socket.on('join-room', ({ roomId, user } = {}) => {
    if (typeof roomId !== 'string' || !roomId || !user?.id) {
      return;
    }

    socket.data.user = user;
    socket.join(roomId);
  });

  socket.on('send-message', ({ roomId, message } = {}) => {
    if (
      typeof roomId !== 'string'
      || !socket.rooms.has(roomId)
      || !message?.id
      || typeof message.message !== 'string'
      || !message.message.trim()
    ) {
      return;
    }

    io.to(roomId).emit('new-message', {
      roomId,
      message: { ...message, status: 'sent' },
    });
  });
});

httpServer.listen(port, '127.0.0.1', () => {
  console.log(`Socket.IO server listening on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});
