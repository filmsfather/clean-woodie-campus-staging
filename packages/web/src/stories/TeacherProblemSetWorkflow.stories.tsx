import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { ProblemSetBuilder } from '../components/problemsets/ProblemSetBuilder';
import { ProblemSetAssignment } from '../components/problemsets/ProblemSetAssignment';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../components/ui';
import { ProblemData } from '../components/problems/editor/ProblemEditor';

// Mock problem data
const mockProblems: ProblemData[] = [
  {
    id: '1',
    title: '분수의 덧셈',
    type: 'multiple-choice',
    difficulty: 'easy',
    subject: 'math',
    gradeLevel: '4',
    content: {
      question: '1/2 + 1/4 = ?',
      choices: [
        { id: 'a', text: '1/6' },
        { id: 'b', text: '2/6' },
        { id: 'c', text: '3/4' },
        { id: 'd', text: '2/4' }
      ]
    },
    answer: { correctChoice: 'c' },
    explanation: '분모를 통분하여 계산합니다.',
    points: 5,
    tags: ['분수', '덧셈', '기초'],
    timeLimit: 120
  },
  {
    id: '2',
    title: '소수의 곱셈',
    type: 'multiple-choice',
    difficulty: 'medium',
    subject: 'math',
    gradeLevel: '4',
    content: {
      question: '2.5 × 3.2 = ?',
      choices: [
        { id: 'a', text: '8.0' },
        { id: 'b', text: '7.5' },
        { id: 'c', text: '8.5' },
        { id: 'd', text: '7.0' }
      ]
    },
    answer: { correctChoice: 'a' },
    explanation: '소수점 자리수를 고려하여 계산합니다.',
    points: 8,
    tags: ['소수', '곱셈', '중급'],
    timeLimit: 180
  },
  {
    id: '3',
    title: '도형의 둘레',
    type: 'short-answer',
    difficulty: 'medium',
    subject: 'math',
    gradeLevel: '4',
    content: {
      question: '가로 8cm, 세로 6cm인 직사각형의 둘레를 구하시오.',
    },
    answer: { text: '28cm' },
    explanation: '직사각형의 둘레 = 2 × (가로 + 세로)',
    points: 10,
    tags: ['도형', '둘레', '중급'],
    timeLimit: 240
  }
];

// Workflow component that shows the complete teacher journey
const TeacherProblemSetWorkflow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'overview' | 'build' | 'assign' | 'complete'>('overview');
  const [problemSetData, setProblemSetData] = useState<any>(null);

  const handleSaveProblemSet = async (data: any) => {
    setProblemSetData({
      ...data,
      id: 'ps-001',
      createdAt: new Date().toISOString(),
    });
    setCurrentStep('assign');
  };

  const handleAssignmentComplete = () => {
    setCurrentStep('complete');
  };

  const resetWorkflow = () => {
    setCurrentStep('overview');
    setProblemSetData(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Progress Steps */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>👩‍🏫</span>
            <span>선생님 문제집 생성 및 배포 워크플로우</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              currentStep === 'overview' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
            }`}>
              <span>1</span>
              <span>시작하기</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              currentStep === 'build' ? 'bg-blue-200 text-blue-800' : 
              ['assign', 'complete'].includes(currentStep) ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
            }`}>
              <span>2</span>
              <span>문제집 만들기</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              currentStep === 'assign' ? 'bg-blue-200 text-blue-800' : 
              currentStep === 'complete' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
            }`}>
              <span>3</span>
              <span>학생에게 배포</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              currentStep === 'complete' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
            }`}>
              <span>4</span>
              <span>완료</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>🎯 새로운 문제집 만들기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              학생들에게 배포할 새로운 문제집을 만들어보세요. 
              다양한 문제를 선택하고 조합하여 맞춤형 학습 자료를 제공할 수 있습니다.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h4 className="font-semibold text-blue-800 mb-2">📚 문제 선택</h4>
                <p className="text-sm text-blue-600">문제 은행에서 원하는 문제들을 선택</p>
              </div>
              <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                <h4 className="font-semibold text-green-800 mb-2">⚙️ 문제집 설정</h4>
                <p className="text-sm text-green-600">제목, 설명, 순서 등을 설정</p>
              </div>
              <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                <h4 className="font-semibold text-purple-800 mb-2">👥 학생 배정</h4>
                <p className="text-sm text-purple-600">클래스나 개별 학생에게 배포</p>
              </div>
            </div>

            <Button onClick={() => setCurrentStep('build')} className="w-full">
              문제집 만들기 시작하기 🚀
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 'build' && (
        <ProblemSetBuilder
          mode="create"
          onSave={handleSaveProblemSet}
          onCancel={() => setCurrentStep('overview')}
        />
      )}

      {currentStep === 'assign' && problemSetData && (
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="font-semibold text-green-800">문제집이 성공적으로 생성되었습니다!</h3>
                  <p className="text-green-600">"{problemSetData.title}" 문제집을 학생들에게 배포할 수 있습니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <ProblemSetAssignment
            problemSetId={problemSetData.id}
            problemSetTitle={problemSetData.title}
            onClose={handleAssignmentComplete}
          />
        </div>
      )}

      {currentStep === 'complete' && problemSetData && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <span>🎉</span>
              <span>문제집 배포 완료!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold mb-2">배포된 문제집 정보</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">제목:</span> {problemSetData.title}</div>
                <div><span className="font-medium">문제 수:</span> {problemSetData.problems.length}개</div>
                <div><span className="font-medium">총 점수:</span> {problemSetData.totalPoints}점</div>
                <div><span className="font-medium">예상 소요시간:</span> {problemSetData.estimatedTime}분</div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">다음 단계</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 학생들이 문제를 풀기 시작하면 실시간으로 진도를 확인할 수 있습니다</li>
                <li>• 대시보드에서 학생별 성과와 분석을 확인하세요</li>
                <li>• 필요시 개별 피드백을 제공하거나 추가 도움을 줄 수 있습니다</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button onClick={resetWorkflow} variant="outline">
                새 문제집 만들기
              </Button>
              <Button onClick={() => alert('대시보드로 이동됩니다')}>
                성과 대시보드 보기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Problems Preview (shown during overview) */}
      {currentStep === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>📝 사용 가능한 문제 예시</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockProblems.map(problem => (
                <div key={problem.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{problem.title}</h4>
                    <Badge 
                      variant={problem.difficulty === 'easy' ? 'success' : 
                              problem.difficulty === 'medium' ? 'warning' : 'error'}
                      size="sm"
                    >
                      {problem.difficulty === 'easy' ? '쉬움' :
                       problem.difficulty === 'medium' ? '보통' : '어려움'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{problem.content.question}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{problem.points}점</span>
                    <span>{problem.timeLimit}초</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const meta: Meta<typeof TeacherProblemSetWorkflow> = {
  title: 'Workflows/Teacher Problem Set Creation',
  component: TeacherProblemSetWorkflow,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# 선생님 문제집 생성 및 배포 워크플로우

이 스토리는 선생님이 문제집을 만들고 학생들에게 배포하는 전체 과정을 보여줍니다.

## 주요 단계

1. **시작하기**: 문제집 생성 개요 및 안내
2. **문제집 만들기**: ProblemSetBuilder를 사용하여 문제 선택 및 설정
3. **학생에게 배포**: ProblemSetAssignment를 사용하여 클래스/학생 선택
4. **완료**: 배포 완료 및 다음 단계 안내

## 포함된 컴포넌트

- \`ProblemSetBuilder\`: 문제집 생성 및 편집
- \`ProblemSetAssignment\`: 학생/클래스에 문제집 배정
- \`Card\`, \`Button\`, \`Badge\`: UI 컴포넌트들

## 사용 사례

- 새 학기 문제집 준비
- 단원별 평가 문제집 생성
- 개별 맞춤 연습 문제집 제작
- 그룹별 차별화 학습 자료 배포
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TeacherProblemSetWorkflow>;

export const CompleteWorkflow: Story = {
  name: '전체 워크플로우',
  args: {},
};

export const ProblemSetBuilderOnly: Story = {
  name: '문제집 빌더만',
  render: () => (
    <div className="max-w-4xl mx-auto p-6">
      <ProblemSetBuilder
        mode="create"
        onSave={async (data) => {
          console.log('문제집 저장:', data);
          alert(`"${data.title}" 문제집이 저장되었습니다!`);
        }}
        onCancel={() => alert('취소되었습니다')}
      />
    </div>
  ),
};

export const AssignmentOnly: Story = {
  name: '배정 화면만',
  render: () => (
    <div className="max-w-4xl mx-auto p-6">
      <ProblemSetAssignment
        problemSetId="ps-sample"
        problemSetTitle="4학년 수학 - 분수와 소수"
        onClose={() => alert('배정이 완료되었습니다!')}
      />
    </div>
  ),
};

export const WithExistingProblemSet: Story = {
  name: '기존 문제집 편집',
  render: () => (
    <div className="max-w-4xl mx-auto p-6">
      <ProblemSetBuilder
        mode="edit"
        initialData={{
          title: '4학년 수학 - 분수와 소수',
          description: '분수의 기본 개념과 소수의 사칙연산을 다루는 문제집입니다.',
          problems: [
            { problemId: '1', orderIndex: 0 },
            { problemId: '2', orderIndex: 1 },
          ],
          totalPoints: 20,
          estimatedTime: 30,
        }}
        onSave={async (data) => {
          console.log('문제집 업데이트:', data);
          alert(`"${data.title}" 문제집이 업데이트되었습니다!`);
        }}
        onCancel={() => alert('편집이 취소되었습니다')}
      />
    </div>
  ),
};