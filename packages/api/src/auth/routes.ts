import { Router } from 'express';
import { AuthController } from './AuthController';
import { InviteController } from './InviteController';

export function createAuthRoutes(
  authController: AuthController,
  inviteController?: InviteController
): Router {
  const router = Router();

  // 기존 인증 라우트
  router.post('/signup', (req, res) => authController.signUp(req, res));
  router.post('/signin', (req, res) => authController.signIn(req, res));
  router.post('/signout', (req, res) => authController.signOut(req, res));
  router.post('/refresh', (req, res) => authController.refreshToken(req, res));
  router.post('/reset-password', (req, res) => authController.resetPassword(req, res));

  // 초대 관련 라우트 (옵션)
  if (inviteController) {
    router.post('/invites', (req, res) => inviteController.createInvite(req, res));
    router.get('/invites/validate', (req, res) => inviteController.validateInviteToken(req, res));
    router.post('/invites/use', (req, res) => inviteController.useInviteToken(req, res));
  }

  return router;
}