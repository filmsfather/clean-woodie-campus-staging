/**
 * Form 컴포넌트 스토리
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Form, FormField, FormLabel, FormError, FormHelperText, FormSection, FormActions, FormGroup, FieldWrapper } from './Form'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { Select } from './Select'
import { Checkbox } from './Checkbox'
import { RadioGroup } from './Radio'
import { Button } from './Button'

const meta = {
  title: 'UI/Form',
  component: Form,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '폼 구성을 위한 다양한 래퍼 컴포넌트들을 제공합니다. FormField, FormLabel, FormError 등을 포함합니다.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '600px', maxWidth: '100vw' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Form>

export default meta
type Story = StoryObj<typeof meta>

export const BasicForm: Story = {
  render: () => (
    <Form>
      <FormField>
        <FormLabel htmlFor="email" required>이메일</FormLabel>
        <Input id="email" type="email" placeholder="example@example.com" />
        <FormHelperText>로그인에 사용할 이메일 주소를 입력하세요</FormHelperText>
      </FormField>
      
      <FormField>
        <FormLabel htmlFor="password" required>비밀번호</FormLabel>
        <Input id="password" type="password" placeholder="비밀번호" />
        <FormError>비밀번호는 8자 이상이어야 합니다</FormError>
      </FormField>
      
      <FormActions>
        <Button type="submit">가입하기</Button>
        <Button type="button" variant="outline">취소</Button>
      </FormActions>
    </Form>
  ),
}

export const ComplexForm: Story = {
  render: () => (
    <Form>
      <FormSection title="기본 정보" description="계정 생성을 위한 기본 정보를 입력해주세요">
        <FormGroup columns={2}>
          <FieldWrapper label="이름" required>
            <Input placeholder="홍길동" />
          </FieldWrapper>
          
          <FieldWrapper label="전화번호">
            <Input placeholder="010-1234-5678" />
          </FieldWrapper>
        </FormGroup>
        
        <FieldWrapper label="이메일" required error="유효한 이메일 주소를 입력해주세요">
          <Input type="email" placeholder="example@example.com" />
        </FieldWrapper>
      </FormSection>
      
      <FormSection title="추가 정보" description="선택적으로 입력할 수 있는 정보입니다">
        <FieldWrapper label="거주 지역">
          <Select
            options={[
              { value: 'seoul', label: '서울' },
              { value: 'busan', label: '부산' },
              { value: 'incheon', label: '인천' },
            ]}
            placeholder="지역을 선택하세요"
          />
        </FieldWrapper>
        
        <FieldWrapper label="성별">
          <RadioGroup
            name="gender"
            options={[
              { value: 'male', label: '남성' },
              { value: 'female', label: '여성' },
              { value: 'other', label: '기타' },
            ]}
            direction="horizontal"
          />
        </FieldWrapper>
        
        <FieldWrapper label="자기소개">
          <Textarea
            placeholder="간단한 자기소개를 작성해주세요"
            maxLength={200}
            showCharCount
          />
        </FieldWrapper>
      </FormSection>
      
      <FormSection>
        <Checkbox label="이용약관에 동의합니다" />
        <Checkbox label="마케팅 정보 수신에 동의합니다" />
      </FormSection>
      
      <FormActions align="right">
        <Button type="button" variant="outline">취소</Button>
        <Button type="submit">가입하기</Button>
      </FormActions>
    </Form>
  ),
}

export const FormLayouts: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">1열 레이아웃</h3>
        <FormGroup columns={1}>
          <FieldWrapper label="이름">
            <Input placeholder="이름" />
          </FieldWrapper>
          <FieldWrapper label="이메일">
            <Input placeholder="이메일" />
          </FieldWrapper>
        </FormGroup>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">2열 레이아웃</h3>
        <FormGroup columns={2}>
          <FieldWrapper label="성">
            <Input placeholder="성" />
          </FieldWrapper>
          <FieldWrapper label="이름">
            <Input placeholder="이름" />
          </FieldWrapper>
          <FieldWrapper label="생년월일">
            <Input type="date" />
          </FieldWrapper>
          <FieldWrapper label="전화번호">
            <Input placeholder="010-1234-5678" />
          </FieldWrapper>
        </FormGroup>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">3열 레이아웃</h3>
        <FormGroup columns={3}>
          <FieldWrapper label="시">
            <Input placeholder="서울시" />
          </FieldWrapper>
          <FieldWrapper label="구">
            <Input placeholder="강남구" />
          </FieldWrapper>
          <FieldWrapper label="동">
            <Input placeholder="역삼동" />
          </FieldWrapper>
        </FormGroup>
      </div>
    </div>
  ),
}

export const FormActions: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 font-medium">왼쪽 정렬</h4>
        <FormActions align="left">
          <Button>저장</Button>
          <Button variant="outline">취소</Button>
        </FormActions>
      </div>
      
      <div>
        <h4 className="mb-2 font-medium">가운데 정렬</h4>
        <FormActions align="center">
          <Button>저장</Button>
          <Button variant="outline">취소</Button>
        </FormActions>
      </div>
      
      <div>
        <h4 className="mb-2 font-medium">오른쪽 정렬</h4>
        <FormActions align="right">
          <Button variant="outline">취소</Button>
          <Button>저장</Button>
        </FormActions>
      </div>
    </div>
  ),
}