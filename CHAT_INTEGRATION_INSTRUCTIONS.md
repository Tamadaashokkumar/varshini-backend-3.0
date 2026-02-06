# Chat Feature Integration Instructions

## Backend Integration Steps

### 1. Update app.js

Add the following line to your `app.js`:

```javascript
const chatRoutes = require('./routes/chatRoutes');

// Add after other routes
app.use('/api/chat', chatRoutes);
```

### 2. Install Required Dependencies

```bash
npm install multer
```

Note: `socket.io` should already be installed.

### 3. Environment Variables

Ensure your `.env` file has:

```env
FRONTEND_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Update server.js (if needed)

Make sure your server.js properly initializes Socket.io:

```javascript
const http = require('http');
const socketIO = require('socket.io');
const app = require('./app');
const initializeSocket = require('./sockets/socketHandler');

const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Initialize socket handlers
initializeSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## API Endpoints

All chat routes are under `/api/chat/`:

- `POST /api/chat/upload` - Upload image/video
- `GET /api/chat/history/:roomId` - Get chat history
- `GET /api/chat/rooms` - Get all chat rooms
- `PUT /api/chat/read/:roomId` - Mark messages as read
- `GET /api/chat/unread-count` - Get unread count
- `DELETE /api/chat/message/:messageId` - Delete message

## Testing

1. Start your backend: `npm run dev`
2. Test file upload:
   ```bash
   curl -X POST http://localhost:5000/api/chat/upload \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@/path/to/image.jpg"
   ```
3. Connect to Socket.io from frontend

## Troubleshooting

- **CORS errors**: Check FRONTEND_URL in .env matches your frontend
- **Upload fails**: Verify Cloudinary credentials
- **Socket connection fails**: Check Socket.io CORS configuration
