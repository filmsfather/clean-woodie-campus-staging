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

  // 새로운 사용자 관리 라우트
  router.delete('/users/:userId', (req, res) => authController.deleteUser(req, res));
  router.get('/users/by-email', (req, res) => authController.findUserByEmail(req, res));
  router.get('/users/by-invite-token', (req, res) => authController.findUserByInviteToken(req, res));

  // 초대 관련 라우트 (옵션)
  if (inviteController) {
    // 기존 초대 라우트
    router.post('/invites', (req, res) => inviteController.createInvite(req, res));
    router.get('/invites/validate', (req, res) => inviteController.validateInviteToken(req, res));
    router.post('/invites/use', (req, res) => inviteController.useInviteToken(req, res));

    // 새로운 초대 관리 라우트
    router.delete('/invites/:inviteId', (req, res) => inviteController.deleteInvite(req, res));
    router.get('/invites/by-email', (req, res) => inviteController.findInvitesByEmail(req, res));
    router.get('/invites/pending', (req, res) => inviteController.findPendingInvitesByEmail(req, res));
    router.get('/invites/by-creator/:creatorId', (req, res) => inviteController.findInvitesByCreator(req, res));
    router.get('/invites/by-organization/:organizationId', (req, res) => inviteController.findInvitesByOrganization(req, res));
    router.delete('/invites/expired', (req, res) => inviteController.deleteExpiredInvites(req, res));
    router.get('/invites/check-active', (req, res) => inviteController.checkActivePendingInvite(req, res));
  }

  return router;
}