/**
 * Modal 컴포넌트 스토리
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal'
import { Button } from './Button'
import { useState } from 'react'

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '포커스 트랩과 접근성을 지원하는 모달 창 컴포넌트입니다.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>모달 열기</Button>
        <Modal open={isOpen} onClose={() => setIsOpen(false)} title="기본 모달">
          <p>이것은 기본 모달입니다. ESC 키를 누르거나 바깥 영역을 클릭하여 닫을 수 있습니다.</p>
        </Modal>
      </>
    )
  },
}

export const WithCustomContent: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>커스텀 모달 열기</Button>
        <Modal open={isOpen} onClose={() => setIsOpen(false)} size="lg">
          <ModalHeader>
            <h2 className="text-xl font-bold">사용자 정의 모달</h2>
            <p className="text-sm text-text-secondary mt-1">서브컴포넌트를 사용한 모달입니다.</p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p>모달 바디 영역입니다. 여기에 다양한 콘텐츠를 넣을 수 있습니다.</p>
              <div className="bg-surface-secondary p-4 rounded">
                <h4 className="font-medium mb-2">안내사항</h4>
                <ul className="text-sm space-y-1">
                  <li>• ESC 키로 모달을 닫을 수 있습니다</li>
                  <li>• Tab 키로 포커스를 이동할 수 있습니다</li>
                  <li>• 바깥 영역 클릭으로도 닫을 수 있습니다</li>
                </ul>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>취소</Button>
            <Button onClick={() => setIsOpen(false)}>확인</Button>
          </ModalFooter>
        </Modal>
      </>
    )
  },
}

export const Sizes: Story = {
  render: () => {
    const [currentSize, setCurrentSize] = useState<string | null>(null)
    
    return (
      <>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setCurrentSize('sm')}>Small</Button>
          <Button size="sm" onClick={() => setCurrentSize('default')}>Default</Button>
          <Button size="sm" onClick={() => setCurrentSize('lg')}>Large</Button>
          <Button size="sm" onClick={() => setCurrentSize('xl')}>Extra Large</Button>
        </div>
        
        <Modal 
          open={!!currentSize} 
          onClose={() => setCurrentSize(null)} 
          size={currentSize as any}
          title={`${currentSize} 모달`}
          description="다양한 크기의 모달을 확인해보세요"
        >
          <p>이것은 {currentSize} 크기의 모달입니다.</p>
        </Modal>
      </>
    )
  },
}

export const NonCloseable: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>닫을 수 없는 모달</Button>
        <Modal 
          open={isOpen} 
          onClose={() => setIsOpen(false)}
          closeOnBackdropClick={false}
          closeOnEscape={false}
          showCloseButton={false}
          title="중요한 작업"
        >
          <p>이 모달은 ESC나 바깥 클릭으로 닫을 수 없습니다. 버튼을 통해서만 닫을 수 있습니다.</p>
          <div className="mt-4">
            <Button onClick={() => setIsOpen(false)}>작업 완료</Button>
          </div>
        </Modal>
      </>
    )
  },
}