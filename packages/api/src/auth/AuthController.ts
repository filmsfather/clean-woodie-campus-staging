import { Request, Response } from 'express';
import { AuthService, AuthContext } from '@woodie/application';
import { UserRole } from '@woodie/domain';

interface AuthRequest extends Request {
  body: {
    email?: string;
    password?: string;
    name?: string;
    role?: UserRole;
    classId?: string;
    refreshToken?: string;
  };
}

export class AuthController {
  constructor(private authService: AuthService) {}

  async signUp(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, name, role, classId } = req.body;

      if (!email || !password || !name || !role) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: email, password, name, role'
        });
        return;
      }

      const context: AuthContext = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        locale: req.get('Accept-Language')?.split(',')[0]
      };

      const result = await this.authService.signUp({
        email,
        password,
        name,
        role,
        classId,
        context
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      const authResult = result.value;
      
      res.status(201).json({
        success: true,
        data: {
          userId: authResult.userId,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          emailConfirmed: authResult.emailConfirmed,
          needsEmailConfirmation: authResult.needsEmailConfirmation
        }
      });
    } catch (error) {
      console.error('SignUp controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async signIn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: email, password'
        });
        return;
      }

      const context: AuthContext = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        locale: req.get('Accept-Language')?.split(',')[0]
      };

      const result = await this.authService.signIn({
        email,
        password,
        context
      });

      if (result.isFailure) {
        res.status(401).json({
          success: false,
          error: result.error
        });
        return;
      }

      const authResult = result.value;
      
      res.status(200).json({
        success: true,
        data: {
          userId: authResult.userId,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          emailConfirmed: authResult.emailConfirmed
        }
      });
    } catch (error) {
      console.error('SignIn controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async signOut(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authHeader = req.get('Authorization');
      const accessToken = authHeader?.replace('Bearer ', '');

      if (!accessToken) {
        res.status(401).json({
          success: false,
          error: 'Missing access token'
        });
        return;
      }

      const context: AuthContext = {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      const result = await this.authService.signOut({
        accessToken,
        context
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Successfully signed out'
      });
    } catch (error) {
      console.error('SignOut controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Missing refresh token'
        });
        return;
      }

      const context: AuthContext = {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      const result = await this.authService.refreshToken({
        refreshToken,
        context
      });

      if (result.isFailure) {
        res.status(401).json({
          success: false,
          error: result.error
        });
        return;
      }

      const authResult = result.value;
      
      res.status(200).json({
        success: true,
        data: {
          userId: authResult.userId,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          emailConfirmed: authResult.emailConfirmed
        }
      });
    } catch (error) {
      console.error('RefreshToken controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: email'
        });
        return;
      }

      const context: AuthContext = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        locale: req.get('Accept-Language')?.split(',')[0]
      };

      const result = await this.authService.resetPassword({
        email,
        context
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error) {
      console.error('ResetPassword controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}