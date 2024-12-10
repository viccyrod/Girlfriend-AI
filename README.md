# Girlfriend.cx

A sophisticated AI chat platform built with Next.js 14, featuring real-time conversations with AI models, memory management, and dynamic chat interfaces.

## 🌟 Features

### Core Functionality
- **Real-time Chat**: Seamless conversations with AI models
- **Memory System**: Context-aware conversations using Pinecone vector database
- **Multiple AI Models**: Support for various AI personalities
- **Authentication**: Secure user authentication via Kinde
- **Responsive Design**: Full mobile and desktop support

### Technical Features
- Server-side rendering with Next.js 14 App Router
- Real-time updates using WebSocket connections
- PostgreSQL database with Prisma ORM
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui component library
- Vector embeddings for conversation memory

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL database
- Pinecone account for vector storage
- Kinde account for authentication

### Environment Setup
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Authentication
KINDE_CLIENT_ID="your_kinde_client_id"
KINDE_CLIENT_SECRET="your_kinde_client_secret"
KINDE_ISSUER_URL="your_kinde_issuer_url"
KINDE_SITE_URL="your_site_url"
KINDE_POST_LOGOUT_REDIRECT_URL="your_logout_redirect"
KINDE_POST_LOGIN_REDIRECT_URL="your_login_redirect"

# Vector Database
PINECONE_API_KEY="your_pinecone_api_key"
PINECONE_ENVIRONMENT="your_pinecone_environment"
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-chat-platform.git
cd ai-chat-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── chat/             # Chat interface pages
│   └── community/        # Community features
├── components/            # React components
│   ├── chat/             # Chat-related components
│   ├── ui/               # UI components
│   └── layouts/          # Layout components
├── lib/                   # Utility functions
│   ├── clients/          # External service clients
│   └── session/          # Authentication utilities
├── types/                 # TypeScript type definitions
└── utils/                # Helper functions
```

## 💻 Development

### Key Commands
```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

## 🔒 Security

- All API routes are protected with authentication
- Rate limiting on sensitive endpoints
- Input validation using Zod
- Secure session management
- XSS protection
- CORS configuration

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

1. Set up environment variables on your hosting platform
2. Configure database connection
3. Build and deploy:
```bash
npm run build
npm start
```

### Supported Platforms
- Vercel (recommended)
- Railway
- Heroku
- Self-hosted

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

Please ensure your PR:
- Follows the existing code style
- Includes appropriate tests
- Updates documentation as needed

## 📝 License

This project is private, commercial and not licensed.
Access to the code is strictly confidential.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Kinde](https://kinde.com/)
- [Pinecone](https://www.pinecone.io/)

## Architecture

### Queue System

The application uses a distributed queue system for AI model generation:

- **Main App (Vercel)**: Handles web requests and queues jobs in Redis
- **Queue Worker (Railway)**: Separate service that processes AI generation jobs
  - Repository: [girlfriend-queue-worker](https://github.com/yourusername/girlfriend-queue-worker)
  - Runs continuously on Railway
  - Polls the Redis queue for new jobs
  - Processes AI model generation requests

### Environment Variables

#### Main App (Vercel)
```env
# Redis Queue (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

#### Queue Worker (Railway)
```env
# API Access
WORKER_ENDPOINT=https://girlfriend.cx/api/ai-models/worker
WORKER_AUTH_TOKEN=your_auth_token

# Queue Configuration
QUEUE_POLL_INTERVAL=5000
QUEUE_RETRY_INTERVAL=10000
QUEUE_MAX_RETRIES=3

# Redis Queue (Upstash) - same as main app
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Flow
1. User requests AI model generation
2. Main app creates pending model in database
3. Job is added to Redis queue
4. Worker picks up job and processes it
5. Worker updates model status when complete

### Deployment
- Main app: Deployed on Vercel
- Queue worker: Deployed on Railway
- Redis queue: Hosted on Upstash

