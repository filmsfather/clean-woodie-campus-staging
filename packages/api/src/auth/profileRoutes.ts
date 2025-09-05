import { Router } from 'express';
import { ProfileController } from './ProfileController';

export function createProfileRoutes(profileController: ProfileController): Router {
  const router = Router();

  // 프로필 CRUD 라우트
  router.post('/profiles', (req, res) => profileController.createProfile(req, res));
  router.get('/profiles/:userId', (req, res) => profileController.getProfile(req, res));
  router.put('/profiles/:userId', (req, res) => profileController.updateProfile(req, res));
  router.delete('/profiles/:userId', (req, res) => profileController.deleteProfile(req, res));
  router.patch('/profiles/:userId/role', (req, res) => profileController.changeRole(req, res));

  // 편의 라우트 (현재 사용자)
  router.get('/profiles/me', (req, res) => profileController.getMyProfile(req, res));
  router.put('/profiles/me', (req, res) => profileController.updateMyProfile(req, res));

  // 검색 및 조회 라우트
  router.get('/profiles/by-email', (req, res) => profileController.findProfileByEmail(req, res));
  router.get('/profiles/by-school/:schoolId', (req, res) => profileController.findProfilesBySchool(req, res));
  router.get('/profiles/by-role', (req, res) => profileController.findProfilesByRole(req, res));
  router.get('/profiles/students/by-grade', (req, res) => profileController.findStudentsByGrade(req, res));

  // 유틸리티 라우트
  router.get('/profiles/check-email', (req, res) => profileController.checkEmailExists(req, res));
  router.get('/profiles/:userId/exists', (req, res) => profileController.checkUserExists(req, res));
  router.get('/profiles/statistics/roles', (req, res) => profileController.getRoleStatistics(req, res));

  return router;
}