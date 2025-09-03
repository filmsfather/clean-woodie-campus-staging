import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  IAuthRepository, 
  AuthResult, 
  Email, 
  Password,
  Result 
} from '@woodie/domain';

export class SupabaseAuthRepository implements IAuthRepository {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async signUp(email: Email, password: Password): Promise<Result<AuthResult>> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: email.value,
        password: password.value,
      });

      if (error) {
        return Result.fail<AuthResult>(this.mapAuthError(error, 'signUp'));
      }

      if (!data.user) {
        return Result.fail<AuthResult>('Unable to create account. Please try again.');
      }

      // Handle email confirmation flow
      if (!data.session) {
        return Result.ok<AuthResult>({
          userId: data.user.id,
          emailConfirmed: false,
          needsEmailConfirmation: true
        });
      }

      return Result.ok<AuthResult>({
        userId: data.user.id,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        emailConfirmed: true
      });
    } catch (error) {
      console.error('SignUp error:', error);
      return Result.fail<AuthResult>('Unable to create account. Please try again.');
    }
  }

  async signIn(email: Email, password: Password): Promise<Result<AuthResult>> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });

      if (error) {
        return Result.fail<AuthResult>(this.mapAuthError(error, 'signIn'));
      }

      if (!data.user || !data.session) {
        return Result.fail<AuthResult>('Invalid email or password.');
      }

      return Result.ok<AuthResult>({
        userId: data.user.id,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        emailConfirmed: true
      });
    } catch (error) {
      console.error('SignIn error:', error);
      return Result.fail<AuthResult>('Unable to sign in. Please try again.');
    }
  }

  async signOut(accessToken: string): Promise<Result<void>> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        return Result.fail<void>(this.mapAuthError(error, 'signOut'));
      }

      return Result.ok<void>();
    } catch (error) {
      console.error('SignOut error:', error);
      return Result.fail<void>('Unable to sign out. Please try again.');
    }
  }

  async refreshToken(refreshToken: string): Promise<Result<AuthResult>> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        return Result.fail<AuthResult>(this.mapAuthError(error, 'refreshToken'));
      }

      if (!data.user || !data.session) {
        return Result.fail<AuthResult>('Unable to refresh session. Please sign in again.');
      }

      return Result.ok<AuthResult>({
        userId: data.user.id,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        emailConfirmed: true
      });
    } catch (error) {
      console.error('RefreshToken error:', error);
      return Result.fail<AuthResult>('Unable to refresh session. Please sign in again.');
    }
  }

  async resetPassword(email: Email): Promise<Result<void>> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email.value);

      if (error) {
        return Result.fail<void>(this.mapAuthError(error, 'resetPassword'));
      }

      return Result.ok<void>();
    } catch (error) {
      console.error('ResetPassword error:', error);
      return Result.fail<void>('Unable to send password reset email. Please try again.');
    }
  }

  private mapAuthError(error: any, operation: string): string {
    console.error(`${operation} error:`, error);

    // Map known Supabase auth errors to user-friendly messages
    switch (error.message) {
      case 'User already registered':
        return 'An account with this email already exists.';
      case 'Invalid login credentials':
        return 'Invalid email or password.';
      case 'Email not confirmed':
        return 'Please check your email and click the confirmation link.';
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long.';
      case 'Unable to validate email address: invalid format':
        return 'Please enter a valid email address.';
      case 'Email rate limit exceeded':
        return 'Too many requests. Please wait a moment and try again.';
      default:
        // Generic message for unknown errors - don't expose internal details
        return `Unable to ${operation === 'signUp' ? 'create account' : operation === 'signIn' ? 'sign in' : 'complete request'}. Please try again.`;
    }
  }
}