import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssignmentListContainer } from '../../containers';
import { useAuth } from '../../contexts/AuthContext';
import { FeatureGuard } from '../../components/auth';

// Teacher Assignments Page - CRUD 및 관리 기능
const TeacherAssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'closed'>('active');

  return (
    <FeatureGuard 
      requiredRole="teacher" 
      fallback={<div className="text-center py-8">Access denied. Teacher role required.</div>}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
            <button
              onClick={() => navigate('/assignments/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Create Assignment
            </button>
          </div>
          
          {/* Status Tabs */}
          <div className="mt-4">
            <nav className="flex space-x-8">
              {[
                { key: 'active', label: 'Active', count: 0 },
                { key: 'draft', label: 'Draft', count: 0 },
                { key: 'closed', label: 'Closed', count: 0 },
                { key: 'all', label: 'All', count: 0 }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.key
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Assignment List Container */}
        <AssignmentListContainer
          initialParams={{
            status: activeTab === 'all' ? 'ALL' : activeTab.toUpperCase() as any,
            sortBy: 'dueDate',
            sortOrder: 'asc'
          }}
          onAssignmentSelect={(assignmentId) => navigate(`/assignments/${assignmentId}`)}
          onAssignmentCreate={(assignment) => {
            navigate(`/assignments/${assignment.id}`);
          }}
        >
          {(props) => (
            <div className="space-y-4">
              {/* Summary Cards */}
              {props.summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {props.summary.totalCount}
                            </span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total Assignments
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {props.summary.totalCount}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-sm">
                              {props.summary.activeCount}
                            </span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Active
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {props.summary.activeCount}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                            <span className="text-yellow-600 font-semibold text-sm">
                              {props.summary.dueSoonCount}
                            </span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Due Soon
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {props.summary.dueSoonCount}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                            <span className="text-red-600 font-semibold text-sm">
                              {props.summary.overdueCount}
                            </span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Overdue
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {props.summary.overdueCount}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {props.loading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {/* Error State */}
              {props.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-red-400">⚠</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        {props.error}
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={props.handleClearError}
                          className="bg-red-100 px-3 py-1 rounded-md text-sm text-red-800 hover:bg-red-200"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {props.isEmpty && !props.loading && (
                <div className="text-center py-12">
                  <div className="mx-auto h-24 w-24 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first assignment.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/assignments/create')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Create Assignment
                    </button>
                  </div>
                </div>
              )}

              {/* Assignment List */}
              {props.hasAssignments && !props.loading && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {props.assignments.map((assignment) => (
                      <li key={assignment.id}>
                        <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  assignment.status === 'ACTIVE' 
                                    ? 'bg-green-100 text-green-800'
                                    : assignment.status === 'DRAFT'
                                    ? 'bg-gray-100 text-gray-800'
                                    : assignment.status === 'CLOSED'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {assignment.status}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center">
                                  <p className="text-sm font-medium text-blue-600 truncate">
                                    <button
                                      onClick={() => props.handleSelectAssignment(assignment.id, true)}
                                      className="hover:text-blue-500"
                                    >
                                      {assignment.title}
                                    </button>
                                  </p>
                                </div>
                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                  <p>
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                  </p>
                                  <span className="mx-2">•</span>
                                  <p>
                                    {assignment.targetInfo.totalTargets} targets
                                  </p>
                                  {assignment.dueDateStatus.isOverdue && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span className="text-red-600 font-medium">
                                        Overdue
                                      </span>
                                    </>
                                  )}
                                  {assignment.dueDateStatus.isDueSoon && !assignment.dueDateStatus.isOverdue && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span className="text-yellow-600 font-medium">
                                        Due Soon
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {assignment.permissions.canActivate && (
                                <button
                                  onClick={() => props.handleActivateAssignment(assignment.id)}
                                  className="text-green-600 hover:text-green-500 text-sm font-medium"
                                >
                                  Activate
                                </button>
                              )}
                              {assignment.permissions.canEdit && (
                                <button
                                  onClick={() => navigate(`/assignments/${assignment.id}/edit`)}
                                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                                >
                                  Edit
                                </button>
                              )}
                              {assignment.permissions.canDelete && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete "${assignment.title}"?`)) {
                                      props.handleDeleteAssignment(assignment.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-500 text-sm font-medium"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </AssignmentListContainer>
      </div>
    </FeatureGuard>
  );
};

// Student Assignments Page - 과제 보기 및 수행 기능
const StudentAssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'assigned' | 'in_progress' | 'completed' | 'all'>('assigned');

  return (
    <FeatureGuard 
      requiredRole="student" 
      fallback={<div className="text-center py-8">Access denied. Student role required.</div>}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
          
          {/* Status Tabs */}
          <div className="mt-4">
            <nav className="flex space-x-8">
              {[
                { key: 'assigned', label: 'Assigned', count: 0 },
                { key: 'in_progress', label: 'In Progress', count: 0 },
                { key: 'completed', label: 'Completed', count: 0 },
                { key: 'all', label: 'All', count: 0 }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.key
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Student Assignment Container - TODO: Import StudentAssignmentContainer */}
        <div className="text-center py-12 text-gray-500">
          Student Assignment Container implementation pending...
        </div>
      </div>
    </FeatureGuard>
  );
};

// Main Assignments Page - Role-based routing
export const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please sign in to view assignments.</p>
      </div>
    );
  }

  // Route based on user role
  switch (user.role) {
    case 'teacher':
    case 'admin':
      return <TeacherAssignmentsPage />;
    case 'student':
      return <StudentAssignmentsPage />;
    default:
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Invalid user role for accessing assignments.</p>
        </div>
      );
  }
};

export default AssignmentsPage;