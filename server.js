
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const donationRoutes = require('./routes/donations');
const projectRoutes = require('./routes/projects');
const volunteerRoutes = require('./routes/volunteers');
const contactRoutes = require('./routes/contact');
const storyRoutes = require('./routes/stories');
const newsRoutes = require('./routes/news');
const partnerRoutes = require('./routes/partners');
const settingsRoutes = require('./routes/settings');
const donationStatsRoutes = require('./routes/donationStats');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy (needed for reverse proxy setups like Nginx)
app.set('trust proxy', 1);

// Security middleware
//app.use(helmet({
 // contentSecurityPolicy: {
   // directives: {
   //   defaultSrc: ["'self'"],
   //   styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
   //  scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
   //   fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
   //   imgSrc: ["'self'", "data:", "blob:", "https:"],
   //   connectSrc: ["'self'"],
   // },
  //},
  //crossOriginEmbedderPolicy: false,
//}));

 app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));





// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
  message: {
    success: false,
    message: { ar: 'تم تجاوز عدد الطلبات المسموح به، يرجى المحاولة لاحقاً', en: 'Too many requests, please try again later' }
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: { ar: 'محاولات تسجيل دخول كثيرة، يرجى المحاولة بعد 15 دقيقة', en: 'Too many login attempts, please try again after 15 minutes' }
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Compression middleware
app.use(compression({
  level: 6, // Balance between compression and CPU usage
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Logging
if (NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files with caching
const cacheOptions = NODE_ENV === 'production' 
  ? { maxAge: '1d', etag: true, lastModified: true }
  : {};

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), cacheOptions));
app.use('/admin', express.static(path.join(__dirname, 'public/admin'), cacheOptions));
app.use('/js', express.static(path.join(__dirname, 'public/website/js'), cacheOptions));
app.use(express.static(path.join(__dirname, 'public/website'), cacheOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/donation-stats', donationStatsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: { ar: 'الصفحة غير موجودة', en: 'Page not found' }
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 API Base URL: http://localhost:${PORT}/api`);
      console.log(`👤 Admin Panel: http://localhost:${PORT}/admin`);
      console.log(`🌐 Website: http://localhost:${PORT}/\n`);
    });

    return server;
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();