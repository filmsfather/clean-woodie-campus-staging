import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Modal } from '../ui/Modal';

interface Tag {
  id: string;
  name: string;
  color: string;
  category: string;
  description?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isSystemTag: boolean; // 시스템 태그는 삭제 불가
}

interface TagCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
  tags: string[]; // tag IDs
}

interface TagManagerProps {
  mode?: 'manage' | 'select' | 'assign';
  selectedTags?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  onTagCreate?: (tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  onTagUpdate?: (tag: Tag) => void;
  onTagDelete?: (tagId: string) => void;
  onCategoryCreate?: (category: Omit<TagCategory, 'id' | 'tags'>) => void;
  onCategoryUpdate?: (category: TagCategory) => void;
  onCategoryDelete?: (categoryId: string) => void;
  showCategories?: boolean;
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  filterByCategory?: string;
  className?: string;
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', 
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', 
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', 
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', 
  '#f43f5e', '#6b7280', '#374151', '#1f2937'
];

const CATEGORY_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', 
  '#10b981', '#6366f1', '#ef4444', '#06b6d4'
];

export const TagManager: React.FC<TagManagerProps> = ({
  mode = 'manage',
  selectedTags = [],
  onTagsChange,
  onTagCreate,
  onTagUpdate,
  onTagDelete,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
  showCategories = true,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
  filterByCategory,
  className = ''
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(filterByCategory || '');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'created'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(selectedTags);
  
  // 모달 상태
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editingCategory, setEditingCategory] = useState<TagCategory | null>(null);
  
  // 폼 상태
  const [newTag, setNewTag] = useState({
    name: '',
    color: TAG_COLORS[0],
    category: '',
    description: ''
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: CATEGORY_COLORS[0],
    description: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 실제 구현에서는 API 호출
        const mockCategories: TagCategory[] = [
          {
            id: 'subject',
            name: '과목',
            color: '#3b82f6',
            description: '과목별 분류',
            tags: ['math-tag', 'korean-tag', 'english-tag']
          },
          {
            id: 'difficulty',
            name: '난이도',
            color: '#8b5cf6',
            description: '난이도별 분류',
            tags: ['easy-tag', 'medium-tag', 'hard-tag']
          },
          {
            id: 'type',
            name: '유형',
            color: '#ec4899',
            description: '문제 유형별 분류',
            tags: ['basic-tag', 'advanced-tag', 'review-tag']
          },
          {
            id: 'custom',
            name: '사용자 정의',
            color: '#10b981',
            description: '사용자가 만든 태그',
            tags: ['important-tag', 'homework-tag', 'test-tag']
          }
        ];

        const mockTags: Tag[] = [
          {
            id: 'math-tag',
            name: '수학',
            color: '#3b82f6',
            category: 'subject',
            description: '수학 과목 관련 문제',
            usageCount: 45,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            createdBy: 'system',
            isSystemTag: true
          },
          {
            id: 'korean-tag',
            name: '국어',
            color: '#3b82f6',
            category: 'subject',
            description: '국어 과목 관련 문제',
            usageCount: 38,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            createdBy: 'system',
            isSystemTag: true
          },
          {
            id: 'english-tag',
            name: '영어',
            color: '#3b82f6',
            category: 'subject',
            description: '영어 과목 관련 문제',
            usageCount: 32,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            createdBy: 'system',
            isSystemTag: true
          },
          {
            id: 'easy-tag',
            name: '쉬움',
            color: '#22c55e',
            category: 'difficulty',
            description: '쉬운 난이도',
            usageCount: 28,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            createdBy: 'system',
            isSystemTag: true
          },
          {
            id: 'medium-tag',
            name: '보통',
            color: '#f59e0b',
            category: 'difficulty',
            description: '보통 난이도',
            usageCount: 35,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            createdBy: 'system',
            isSystemTag: true
          },
          {
            id: 'hard-tag',
            name: '어려움',
            color: '#ef4444',
            category: 'difficulty',
            description: '어려운 난이도',
            usageCount: 22,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            createdBy: 'system',
            isSystemTag: true
          },
          {
            id: 'basic-tag',
            name: '기초',
            color: '#84cc16',
            category: 'type',
            description: '기초 문제',
            usageCount: 41,
            createdAt: '2024-01-05',
            updatedAt: '2024-01-05',
            createdBy: '김교사',
            isSystemTag: false
          },
          {
            id: 'advanced-tag',
            name: '심화',
            color: '#8b5cf6',
            category: 'type',
            description: '심화 문제',
            usageCount: 18,
            createdAt: '2024-01-10',
            updatedAt: '2024-01-10',
            createdBy: '박교사',
            isSystemTag: false
          },
          {
            id: 'important-tag',
            name: '중요',
            color: '#ef4444',
            category: 'custom',
            description: '중요한 문제',
            usageCount: 26,
            createdAt: '2024-01-15',
            updatedAt: '2024-01-15',
            createdBy: '이교사',
            isSystemTag: false
          },
          {
            id: 'homework-tag',
            name: '숙제',
            color: '#f59e0b',
            category: 'custom',
            description: '숙제용 문제',
            usageCount: 33,
            createdAt: '2024-01-20',
            updatedAt: '2024-01-20',
            createdBy: '최교사',
            isSystemTag: false
          }
        ];

        setCategories(mockCategories);
        setTags(mockTags);
      } catch (error) {
        console.error('태그 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setSelectedTagIds(selectedTags);
  }, [selectedTags]);

  useEffect(() => {
    // 검색 및 필터링 적용
    let filtered = tags.filter(tag => {
      // 검색 쿼리 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          tag.name.toLowerCase().includes(query) ||
          (tag.description && tag.description.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // 카테고리 필터
      if (selectedCategory && tag.category !== selectedCategory) {
        return false;
      }

      return true;
    });

    // 정렬 적용
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredTags(filtered);
  }, [tags, searchQuery, selectedCategory, sortBy]);

  const handleTagSelect = (tagId: string, checked: boolean) => {
    const newSelection = checked 
      ? [...selectedTagIds, tagId]
      : selectedTagIds.filter(id => id !== tagId);
    
    setSelectedTagIds(newSelection);
    onTagsChange?.(newSelection);
  };

  const handleCreateTag = () => {
    if (!newTag.name.trim()) return;

    const tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> = {
      name: newTag.name.trim(),
      color: newTag.color,
      category: newTag.category,
      description: newTag.description.trim(),
      createdBy: 'current-user', // 실제로는 현재 사용자
      isSystemTag: false
    };

    onTagCreate?.(tag);
    
    // 로컬 상태 업데이트 (실제로는 API 응답을 기다려야 함)
    const newTagWithId: Tag = {
      ...tag,
      id: `tag-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };
    
    setTags(prev => [...prev, newTagWithId]);
    setNewTag({ name: '', color: TAG_COLORS[0], category: '', description: '' });
    setShowCreateTagModal(false);
  };

  const handleUpdateTag = () => {
    if (!editingTag) return;

    const updatedTag: Tag = {
      ...editingTag,
      updatedAt: new Date().toISOString()
    };

    onTagUpdate?.(updatedTag);
    
    // 로컬 상태 업데이트
    setTags(prev => prev.map(tag => tag.id === updatedTag.id ? updatedTag : tag));
    setEditingTag(null);
  };

  const handleDeleteTag = (tag: Tag) => {
    if (tag.isSystemTag) {
      alert('시스템 태그는 삭제할 수 없습니다.');
      return;
    }

    if (tag.usageCount > 0) {
      const confirmed = confirm(`이 태그는 ${tag.usageCount}개의 문제에 사용되고 있습니다. 정말 삭제하시겠습니까?`);
      if (!confirmed) return;
    }

    onTagDelete?.(tag.id);
    
    // 로컬 상태 업데이트
    setTags(prev => prev.filter(t => t.id !== tag.id));
    setSelectedTagIds(prev => prev.filter(id => id !== tag.id));
  };

  const handleCreateCategory = () => {
    if (!newCategory.name.trim()) return;

    const category: Omit<TagCategory, 'id' | 'tags'> = {
      name: newCategory.name.trim(),
      color: newCategory.color,
      description: newCategory.description.trim()
    };

    onCategoryCreate?.(category);
    
    // 로컬 상태 업데이트
    const newCategoryWithId: TagCategory = {
      ...category,
      id: `category-${Date.now()}`,
      tags: []
    };
    
    setCategories(prev => [...prev, newCategoryWithId]);
    setNewCategory({ name: '', color: CATEGORY_COLORS[0], description: '' });
    setShowCreateCategoryModal(false);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '미분류';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#6b7280';
  };

  const renderTagCard = (tag: Tag) => (
    <Card 
      key={tag.id} 
      className={`cursor-pointer transition-all hover:shadow-md ${
        mode === 'select' && selectedTagIds.includes(tag.id) ? 'ring-2 ring-primary' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {mode === 'select' && (
                <Checkbox
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={(checked) => handleTagSelect(tag.id, checked)}
                />
              )}
              <Badge 
                style={{ backgroundColor: tag.color, color: 'white' }}
                className="font-medium"
              >
                {tag.name}
              </Badge>
              {tag.isSystemTag && (
                <Badge variant="outline" size="sm">시스템</Badge>
              )}
            </div>
            
            {mode === 'manage' && (
              <div className="flex space-x-1">
                {allowEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTag(tag)}
                  >
                    수정
                  </Button>
                )}
                {allowDelete && !tag.isSystemTag && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTag(tag)}
                  >
                    삭제
                  </Button>
                )}
              </div>
            )}
          </div>

          {tag.description && (
            <p className="text-sm text-text-secondary">{tag.description}</p>
          )}

          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                size="sm"
                style={{ borderColor: getCategoryColor(tag.category) }}
              >
                {getCategoryName(tag.category)}
              </Badge>
            </div>
            <span>{tag.usageCount}회 사용</span>
          </div>

          <div className="text-xs text-text-tertiary">
            작성: {tag.createdBy} • {new Date(tag.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTagList = () => {
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTags.map(renderTagCard)}
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          {filteredTags.map(tag => (
            <Card key={tag.id} className="cursor-pointer hover:bg-surface-secondary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {mode === 'select' && (
                      <Checkbox
                        checked={selectedTagIds.includes(tag.id)}
                        onChange={(checked) => handleTagSelect(tag.id, checked)}
                      />
                    )}
                    
                    <Badge 
                      style={{ backgroundColor: tag.color, color: 'white' }}
                      className="font-medium"
                    >
                      {tag.name}
                    </Badge>
                    
                    <span className="text-sm text-text-secondary flex-1">
                      {tag.description}
                    </span>
                    
                    <Badge 
                      variant="outline" 
                      size="sm"
                      style={{ borderColor: getCategoryColor(tag.category) }}
                    >
                      {getCategoryName(tag.category)}
                    </Badge>
                    
                    <span className="text-sm text-text-tertiary">
                      {tag.usageCount}회
                    </span>
                    
                    {mode === 'manage' && (
                      <div className="flex space-x-1">
                        {allowEdit && (
                          <Button variant="ghost" size="sm" onClick={() => setEditingTag(tag)}>
                            수정
                          </Button>
                        )}
                        {allowDelete && !tag.isSystemTag && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTag(tag)}>
                            삭제
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className={`tag-manager loading ${className}`}>
        <div className="loading-spinner">태그를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className={`tag-manager ${className} space-y-6`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">태그 관리</h2>
          <p className="text-text-secondary">
            {mode === 'manage' && '태그를 생성, 수정, 삭제할 수 있습니다'}
            {mode === 'select' && '문제에 적용할 태그를 선택하세요'}
            {mode === 'assign' && '선택된 문제들에 태그를 할당하세요'}
          </p>
        </div>
        
        {mode === 'manage' && allowCreate && (
          <div className="flex space-x-2">
            {showCategories && (
              <Button variant="outline" onClick={() => setShowCreateCategoryModal(true)}>
                카테고리 추가
              </Button>
            )}
            <Button onClick={() => setShowCreateTagModal(true)}>
              태그 추가
            </Button>
          </div>
        )}
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="태그 이름이나 설명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {showCategories && (
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
              >
                <option value="">모든 카테고리</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            )}
            
            <Select value={sortBy} onChange={(value) => setSortBy(value as any)}>
              <option value="name">이름순</option>
              <option value="usage">사용빈도순</option>
              <option value="created">생성일순</option>
            </Select>
            
            <div className="flex">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                ⊞
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                ☰
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 선택된 태그 표시 (select 모드에서만) */}
      {mode === 'select' && selectedTagIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>선택된 태그 ({selectedTagIds.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedTagIds.map(tagId => {
                const tag = tags.find(t => t.id === tagId);
                if (!tag) return null;
                return (
                  <Badge
                    key={tagId}
                    style={{ backgroundColor: tag.color, color: 'white' }}
                    className="cursor-pointer"
                    onClick={() => handleTagSelect(tagId, false)}
                  >
                    {tag.name} ×
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 태그 목록 */}
      {filteredTags.length > 0 ? (
        renderTagList()
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-text-secondary">
              {searchQuery || selectedCategory ? '조건에 맞는 태그가 없습니다.' : '태그가 없습니다.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 태그 생성 모달 */}
      <Modal
        isOpen={showCreateTagModal}
        onClose={() => setShowCreateTagModal(false)}
        title="새 태그 만들기"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">태그 이름 *</label>
            <Input
              value={newTag.name}
              onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
              placeholder="태그 이름을 입력하세요"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">색상</label>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map(color => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newTag.color === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewTag(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>
          
          {showCategories && (
            <div>
              <label className="block text-sm font-medium mb-2">카테고리</label>
              <Select
                value={newTag.category}
                onChange={(value) => setNewTag(prev => ({ ...prev, category: value }))}
              >
                <option value="">카테고리 선택</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">설명</label>
            <Input
              value={newTag.description}
              onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
              placeholder="태그 설명 (선택사항)"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setShowCreateTagModal(false)}>
              취소
            </Button>
            <Button onClick={handleCreateTag}>
              생성
            </Button>
          </div>
        </div>
      </Modal>

      {/* 태그 수정 모달 */}
      <Modal
        isOpen={!!editingTag}
        onClose={() => setEditingTag(null)}
        title="태그 수정"
      >
        {editingTag && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">태그 이름 *</label>
              <Input
                value={editingTag.name}
                onChange={(e) => setEditingTag(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="태그 이름을 입력하세요"
                disabled={editingTag.isSystemTag}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">색상</label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      editingTag.color === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditingTag(prev => prev ? { ...prev, color } : null)}
                    disabled={editingTag.isSystemTag}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">설명</label>
              <Input
                value={editingTag.description || ''}
                onChange={(e) => setEditingTag(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="태그 설명 (선택사항)"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setEditingTag(null)}>
                취소
              </Button>
              <Button onClick={handleUpdateTag}>
                수정
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 카테고리 생성 모달 */}
      <Modal
        isOpen={showCreateCategoryModal}
        onClose={() => setShowCreateCategoryModal(false)}
        title="새 카테고리 만들기"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">카테고리 이름 *</label>
            <Input
              value={newCategory.name}
              onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              placeholder="카테고리 이름을 입력하세요"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">색상</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map(color => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newCategory.color === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">설명</label>
            <Input
              value={newCategory.description}
              onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
              placeholder="카테고리 설명 (선택사항)"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setShowCreateCategoryModal(false)}>
              취소
            </Button>
            <Button onClick={handleCreateCategory}>
              생성
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TagManager;