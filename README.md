# Artitrack Testing

A full-stack web application with Laravel backend and React frontend.

## 🚀 Live Deployment

- **Frontend (Vercel)**: [Your Vercel URL]
- **Backend (Railway)**: [Your Railway URL]

## 📋 Project Structure

```
ArtitrackTesting/
├── backend/          # Laravel API backend
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── routes/
│   └── ...
├── frontend/         # React frontend
│   ├── src/
│   ├── public/
│   └── ...
└── DEPLOYMENT.md     # Comprehensive deployment guide
```

## 🛠️ Technology Stack

### Backend
- **Framework**: Laravel 12.x
- **PHP**: 8.2+
- **Database**: PostgreSQL (Production) / SQLite (Local)
- **Authentication**: Laravel Sanctum
- **Hosting**: Railway

### Frontend
- **Framework**: React 19.x
- **Build Tool**: Create React App
- **HTTP Client**: Axios
- **Routing**: React Router v7
- **Hosting**: Vercel

## 🏃 Local Development

### Backend Setup

```bash
cd backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Start development server
php artisan serve
```

Backend will run at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run at `http://localhost:3000`

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Deploy Steps

1. **Backend to Railway**:
   - Connect GitHub repository
   - Add PostgreSQL database
   - Configure environment variables
   - Deploy automatically

2. **Frontend to Vercel**:
   - Import GitHub repository
   - Set root directory to `frontend`
   - Add `REACT_APP_API_BASE` environment variable
   - Deploy automatically

## 📝 Environment Variables

### Backend (.env)

```bash
APP_KEY=base64:...
APP_URL=https://your-backend.railway.app
DB_CONNECTION=pgsql
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (.env.production)

```bash
REACT_APP_API_BASE=https://your-backend.railway.app
```

## 🔧 Configuration Files

- `backend/railway.json` - Railway deployment configuration
- `backend/Procfile` - Process configuration for Railway
- `frontend/vercel.json` - Vercel deployment configuration
- `backend/config/cors.php` - CORS configuration for API

## 🧪 Testing

### Backend Tests

```bash
cd backend
php artisan test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📚 API Documentation

API endpoints are available at `/api/*`. Key endpoints:

- `GET /api/health` - Health check
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user
- Additional endpoints in `backend/routes/api.php`

## 🔐 Security

- CORS configured for production domains
- Laravel Sanctum for API authentication
- CSRF protection enabled
- Environment variables secured
- HTTPS enforced in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For deployment issues, see [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section.

For code issues, please open an issue on GitHub.

## 🔗 Useful Links

- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
