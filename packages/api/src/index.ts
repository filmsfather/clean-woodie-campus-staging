// API layer - Express server entry point
import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createAuthRoutes } from './auth/routes';
import { AuthController } from './auth/AuthController';
import { mountSRSRoutes } from './srs/routes/ReviewRoutes';
import { 
  AuthService,
  SignUpUseCase,
  SignInUseCase,
  SignOutUseCase,
  RefreshTokenUseCase,
  ResetPasswordUseCase
} from '@woodie/application';
import { 
  SupabaseAuthRepository,
  SupabaseUserRepository 
} from '@woodie/infrastructure';

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Initialize repositories
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY');
}

const authRepository = new SupabaseAuthRepository(supabaseUrl, supabaseKey);
const userRepository = new SupabaseUserRepository(supabaseUrl, supabaseKey);

// Initialize use cases
const signUpUseCase = new SignUpUseCase(userRepository, authRepository);
const signInUseCase = new SignInUseCase(authRepository);
const signOutUseCase = new SignOutUseCase(authRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(authRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(authRepository);

// Initialize service
const authService = new AuthService(
  signUpUseCase,
  signInUseCase,
  signOutUseCase,
  refreshTokenUseCase,
  resetPasswordUseCase
);

// Initialize controller
const authController = new AuthController(authService);

// Routes
app.use('/api/auth', createAuthRoutes(authController));

// SRS Routes
mountSRSRoutes(app);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

app.listen(port, () => {
  console.log(`API server running on port ${port}`)
})

export default app