import { Router } from 'express';
import { ProfileController } from './ProfileController';

export function createProfileRoutes(profileController: ProfileController): Router {
  const router = Router();

  // 프로필 CRUD 라우트
  router.post('/profiles', (req, res) => profileController.createProfile(req, res));
  router.get('/profiles/:userId', (req, res) => profileController.getProfile(req, res));
  router.put('/profiles/:userId', (req, res) => profileController.updateProfile(req, res));
  router.patch('/profiles/:userId/role', (req, res) => profileController.changeRole(req, res));

  // 편의 라우트 (현재 사용자)
  router.get('/profiles/me', (req, res) => profileController.getMyProfile(req, res));
  router.put('/profiles/me', (req, res) => profileController.updateMyProfile(req, res));

  return router;
}