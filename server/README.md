# HSA Songbook Backend Server

MongoDB/Express backend API server for HSA Songbook with vertical slice architecture.

## Features

- ✅ MongoDB with Mongoose ODM
- ✅ Vertical Slice Architecture
- ✅ ZSTD compression for ChordPro data (60-80% storage savings)
- ✅ Clerk authentication integration
- ✅ RESTful API endpoints
- ✅ TypeScript with strict mode
- ✅ Comprehensive error handling

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Clerk account for authentication

### Installation

```bash
# From project root
npm run install:all

# Or just server
cd server
npm install
```

### Environment Variables

Copy `.env.server` in the project root and update with your values:

```env
MONGO_URI=mongodb://localhost:27017/hsa-songbook-dev
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Development

### Run both frontend and backend

```bash
# From project root
npm run dev:full
```

### Run backend only

```bash
cd server
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000
Health: http://localhost:5000/health

## API Endpoints

### Songs
- `GET /api/v1/songs` - Get all songs
- `GET /api/v1/songs/:id` - Get song by ID
- `GET /api/v1/songs/slug/:slug` - Get song by slug
- `POST /api/v1/songs` - Create song (auth required)
- `PATCH /api/v1/songs/:id` - Update song (auth required)
- `DELETE /api/v1/songs/:id` - Delete song (admin only)

### Arrangements
- `GET /api/v1/arrangements` - Get all arrangements
- `GET /api/v1/arrangements/:id` - Get arrangement with decompressed ChordPro
- `GET /api/v1/arrangements/song/:songId` - Get arrangements for a song
- `POST /api/v1/arrangements` - Create arrangement (auth required)
- `PATCH /api/v1/arrangements/:id` - Update arrangement (auth required)

### Users
- `GET /api/v1/users/me` - Get current user (auth required)
- `PATCH /api/v1/users/me` - Update preferences (auth required)
- `POST /api/v1/users/webhook` - Clerk webhook endpoint

## Architecture

```
server/
├── features/           # Vertical slices
│   ├── songs/         # Complete song feature
│   ├── arrangements/  # Arrangements with compression
│   └── users/         # User management
├── shared/            # Cross-cutting concerns
│   ├── config/        # Database, environment
│   ├── middleware/    # Auth, error handling
│   └── services/      # Compression service
└── app.ts            # Express app setup
```

## Testing

```bash
cd server
npm test
npm run test:coverage
```

## ZSTD Compression

ChordPro data is automatically compressed using ZSTD:
- 60-80% storage reduction
- Transparent compression/decompression
- Metrics included in API responses

## Clerk Integration

Users are automatically synced from Clerk via webhooks:
1. Configure webhook endpoint in Clerk Dashboard: `https://your-domain/api/v1/users/webhook`
2. Set `CLERK_WEBHOOK_SECRET` in environment
3. Users created/updated/deleted automatically sync to MongoDB

## Production Build

```bash
cd server
npm run build
npm start
```