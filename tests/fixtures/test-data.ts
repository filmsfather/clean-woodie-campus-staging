// 테스트에서 사용할 공통 데이터

export const testUsers = {
  student: {
    userId: 'test-student-1',
    email: 'student@woodie.test',
    fullName: '김학생',
    role: 'student' as const,
    schoolId: 'woodie-school-1',
    gradeLevel: 10
  },
  teacher: {
    userId: 'test-teacher-1', 
    email: 'teacher@woodie.test',
    fullName: '이선생',
    role: 'teacher' as const,
    schoolId: 'woodie-school-1'
  },
  admin: {
    userId: 'test-admin-1',
    email: 'admin@woodie.test', 
    fullName: '박관리자',
    role: 'admin' as const,
    schoolId: 'woodie-school-1'
  }
};

export const testSchools = {
  woodieSchool: {
    id: 'woodie-school-1',
    name: '우디캠퍼스 고등학교',
    address: '서울시 강남구 테헤란로 123'
  }
};

export const testInvites = {
  studentInvite: {
    email: 'newstudent@woodie.test',
    role: 'student' as const,
    organizationId: 'woodie-school-1',
    classId: 'class-10-1'
  },
  teacherInvite: {
    email: 'newteacher@woodie.test',
    role: 'teacher' as const,
    organizationId: 'woodie-school-1'
  }
};

export const invalidTestData = {
  invalidEmails: [
    'invalid-email',
    'test@',
    '@woodie.test',
    'test..test@woodie.test',
    ''
  ],
  invalidNames: [
    '',
    '   ',
    'a', // 너무 짧음
    'a'.repeat(101) // 너무 김
  ]
};