import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssignmentDetail } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import { FeatureGuard } from '../../components/auth';

export const AssignmentDetailPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'targets' | 'progress'>('overview');

  const {
    assignment,
    loading,
    error,
    refresh,
    clearError
  } = useAssignmentDetail(assignmentId || null);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={refresh}
                  className="bg-red-100 px-3 py-1 rounded-md text-sm text-red-800 hover:bg-red-200"
                >
                  Retry
                </button>
                <button
                  onClick={clearError}
                  className="bg-red-100 px-3 py-1 rounded-md text-sm text-red-800 hover:bg-red-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Assignment not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The assignment you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/assignments')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Assignments
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check permissions based on user role
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const canEdit = isTeacher && assignment.teacherId === user?.id;

  return (
    <FeatureGuard 
      requiredRole={["teacher", "student", "admin"]} 
      fallback={<div className="text-center py-8">Access denied.</div>}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/assignments')}
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
                <div className="mt-1 flex items-center space-x-3 text-sm text-gray-500">
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
                  <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  {assignment.dueDateStatus?.isOverdue && (
                    <span className="text-red-600 font-medium">Overdue</span>
                  )}
                  {assignment.dueDateStatus?.isDueSoon && !assignment.dueDateStatus?.isOverdue && (
                    <span className="text-yellow-600 font-medium">Due Soon</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {isStudent && assignment.status === 'ACTIVE' && (
                <button
                  onClick={() => navigate(`/assignments/${assignmentId}/solve`)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Start Assignment
                </button>
              )}
              
              {canEdit && (
                <>
                  {assignment.status === 'DRAFT' && assignment.targets && (
                    <button
                      // onClick={() => activateAssignment(assignment.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Activate
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate(`/assignments/${assignmentId}/edit`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${assignment.title}"?`)) {
                        // deleteAssignment(assignment.id)
                        navigate('/assignments');
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <nav className="flex space-x-8">
              {[
                { key: 'overview', label: 'Overview' },
                ...(isTeacher ? [
                  { key: 'targets', label: 'Targets' },
                  { key: 'progress', label: 'Progress' }
                ] : [])
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
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Details</h3>
                  
                  {assignment.description && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {assignment.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Due Date</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(assignment.dueDate).toLocaleString()}
                      </p>
                    </div>
                    
                    {assignment.maxAttempts && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Max Attempts</h4>
                        <p className="text-sm text-gray-600 mt-1">{assignment.maxAttempts}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Problem Set</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        <button
                          onClick={() => navigate(`/problem-sets/${assignment.problemSetId}`)}
                          className="text-blue-600 hover:text-blue-500"
                        >
                          View Problem Set
                        </button>
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Created</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(assignment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status Card */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
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
                    
                    {assignment.dueDateStatus && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Days Until Due</span>
                          <span className={`text-sm font-medium ${
                            assignment.dueDateStatus.isOverdue
                              ? 'text-red-600'
                              : assignment.dueDateStatus.isDueSoon
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`}>
                            {assignment.dueDateStatus.daysUntilDue}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status Message</span>
                          <span className="text-sm text-gray-900">
                            {assignment.dueDateStatus.statusMessage}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Targets Card (Teacher View) */}
                {isTeacher && assignment.targets && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Targets</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Targets</span>
                        <span className="text-sm font-medium text-gray-900">
                          {assignment.targets.totalCount}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Active Targets</span>
                        <span className="text-sm font-medium text-gray-900">
                          {assignment.targets.activeCount}
                        </span>
                      </div>
                      
                      {assignment.targets.assignedClasses.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600">Classes</span>
                          <div className="mt-1 space-y-1">
                            {assignment.targets.assignedClasses.map(classId => (
                              <div key={classId} className="text-sm text-gray-900">
                                Class {classId}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {assignment.targets.assignedStudents.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600">Individual Students</span>
                          <div className="mt-1 space-y-1">
                            {assignment.targets.assignedStudents.map(studentId => (
                              <div key={studentId} className="text-sm text-gray-900">
                                Student {studentId}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Targets Tab (Teacher Only) */}
          {activeTab === 'targets' && isTeacher && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Targets</h3>
              <p className="text-gray-500">Target management interface will be implemented here.</p>
            </div>
          )}

          {/* Progress Tab (Teacher Only) */}
          {activeTab === 'progress' && isTeacher && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Student Progress</h3>
              <p className="text-gray-500">Progress tracking interface will be implemented here.</p>
            </div>
          )}
        </div>
      </div>
    </FeatureGuard>
  );
};

export default AssignmentDetailPage;