import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import preferenceRoutes from './routes/preference.routes.js';
import userRoutes from './routes/user.routes.js';
import recipeRoutes from './routes/recipe.routes.js';
import mealPlanRoutes from './routes/mealPlan.routes.js';
import groceryRoutes from './routes/grocery.routes.js';
import foodAnalysisRoutes from './routes/foodAnalysis.routes.js';
import foodDiaryRoutes from './routes/foodDiary.routes.js';
import zaiRoutes from './routes/zai.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

const app = express();

// CORS configuration for local Vite development and production Vercel frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, server-to-server, mobile)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during development phase
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Core API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/grocery', groceryRoutes);
app.use('/api/food-analysis', foodAnalysisRoutes);
app.use('/api/food-diary', foodDiaryRoutes);
app.use('/api/zai', zaiRoutes);

// Root informational route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Zaiqo API Server',
    health: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      signup: 'POST /api/auth/signup',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      preferences: {
        get: 'GET /api/preferences',
        create: 'POST /api/preferences',
        update: 'PUT /api/preferences',
        delete: 'DELETE /api/preferences',
      },
      userProfile: 'GET /api/users/profile',
      recipes: {
        list: 'GET /api/recipes',
        getSingle: 'GET /api/recipes/:id',
        create: 'POST /api/recipes',
        update: 'PUT /api/recipes/:id',
        delete: 'DELETE /api/recipes/:id',
        saved: 'GET /api/recipes/saved',
        save: 'POST /api/recipes/:recipeId/save',
        unsave: 'DELETE /api/recipes/:recipeId/save',
        checkSaved: 'GET /api/recipes/:recipeId/saved',
      },
      mealPlans: {
        list: 'GET /api/meal-plans',
        getSingle: 'GET /api/meal-plans/:id',
        create: 'POST /api/meal-plans',
        update: 'PUT /api/meal-plans/:id',
        delete: 'DELETE /api/meal-plans/:id',
        updateSlot: 'PUT /api/meal-plans/:id/meals',
      },
      grocery: {
        list: 'GET /api/grocery',
        getSingle: 'GET /api/grocery/:id',
        create: 'POST /api/grocery',
        update: 'PUT /api/grocery/:id',
        delete: 'DELETE /api/grocery/:id',
        addItem: 'POST /api/grocery/:id/items',
        updateItem: 'PUT /api/grocery/:id/items/:itemId',
        deleteItem: 'DELETE /api/grocery/:id/items/:itemId',
        fromMealPlan: 'POST /api/grocery/from-meal-plan/:mealPlanId',
        shoppingLinks: 'GET /api/grocery/:id/shopping-links',
        priceComparison: 'GET /api/grocery/:id/price-comparison',
      },
      foodAnalysis: {
        analyze: 'POST /api/food-analysis',
        history: 'GET /api/food-analysis',
        getSingle: 'GET /api/food-analysis/:id',
        delete: 'DELETE /api/food-analysis/:id',
      },
      zai: {
        message: 'POST /api/zai/message',
      },
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Global centralized error handler
app.use(errorHandler);

export default app;
