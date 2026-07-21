# OpenSyzitisi - Modern Team Communication Platform

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/Node.js-20.x-brightgreen.svg" alt="Node.js">
</p>

OpenSyzitisi is a modern, self-hosted team communication platform inspired by Slack and Rocket.Chat. It features a clean, fast, and minimal UI with real-time messaging, channels, direct messages, and comprehensive admin controls.

## ✨ Features

### Core Features
- **Real-time Messaging** - Instant message delivery using Socket.IO
- **Channels** - Public and private channels for team discussions
- **Direct Messages** - Private one-to-one conversations
- **File Sharing** - Upload and share images, documents, and more
- **Emoji Reactions** - React to messages with emojis
- **Message Editing** - Edit and delete your messages
- **Typing Indicators** - See when others are typing
- **Read Receipts** - Know when your messages are seen
- **Search** - Search across users, channels, and messages

### User Features
- **Dark/Light Themes** - Beautiful theme support
- **User Profiles** - Custom avatars, bios, and status
- **Online Status** - See who's online, away, or busy
- **Notifications** - Desktop and in-app notifications
- **Mentions** - Get notified when @mentioned
- **Keyboard Shortcuts** - Navigate efficiently

### Admin Features
- **Admin Dashboard** - View platform statistics
- **User Management** - Create, edit, delete, enable/disable users
- **Role Management** - Admin and user roles
- **Password Reset** - Admin can reset user passwords
- **Channel Management** - View and manage all channels

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/opensyzitisi.git
   cd opensyzitisi
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and update JWT_SECRET and ADMIN_PASSWORD
   ```

3. **Start the application**
   ```bash
   docker compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - API Docs: http://localhost/api/docs

5. **Login with admin credentials**
   - Email: `admin@opensyzitisi.local` (or your configured ADMIN_EMAIL)
   - Password: `admin123` (or your configured ADMIN_PASSWORD)

## 🔌 API Documentation

API documentation is available via Swagger UI when the backend is running:
- **Production**: http://localhost/api/docs

### Authentication
All protected routes require JWT Bearer token:
```
Authorization: Bearer <your-token>
```

## 🔒 Security

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: HS256 signed tokens
- **Rate Limiting**: Throttler module (100 requests/minute)
- **Input Validation**: class-validator with DTOs
- **Helmet**: Security headers
- **CORS**: Configured for frontend origin
- **File Upload**: Type validation and size limits

## 🐳 Docker Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# View logs
docker compose logs -f

# Rebuild after changes
docker compose up -d --build
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by the OpenSyzitisi Team
</p>
