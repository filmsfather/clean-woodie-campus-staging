import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AssignmentFormContainer } from '../../containers';
import { FeatureGuard } from '../../components/auth';

export const CreateAssignmentPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <FeatureGuard 
      requiredRole="teacher" 
      fallback={<div className="text-center py-8">Access denied. Teacher role required.</div>}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/assignments')}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Create New Assignment</h1>
          </div>
        </div>

        {/* Assignment Form Container */}
        <AssignmentFormContainer
          onSuccess={(assignment) => {
            // TODO: Show success toast
            console.log('Assignment created successfully:', assignment);
            navigate(`/assignments/${assignment.id}`);
          }}
          onError={(error) => {
            // TODO: Show error toast
            console.error('Failed to create assignment:', error);
          }}
          onCancel={() => navigate('/assignments')}
        >
          {(props) => (
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {/* Loading State */}
                {props.loading && (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {/* Error State */}
                {props.error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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

                {/* Form Content */}
                {!props.loading && (
                  <form onSubmit={(e) => { e.preventDefault(); props.handleFormSubmit(); }}>
                    <div className="space-y-6">
                      {/* Problem Set Selection */}
                      <div>
                        <label htmlFor="problemSetId" className="block text-sm font-medium text-gray-700">
                          Problem Set *
                        </label>
                        <select
                          id="problemSetId"
                          value={props.formData.problemSetId}
                          onChange={(e) => props.handleFieldChange('problemSetId', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            props.formErrors.problemSetId ? 'border-red-300' : 'border-gray-300'
                          }`}
                          required
                        >
                          <option value="">Select a problem set...</option>
                          {props.problemSets.map(problemSet => (
                            <option key={problemSet.id} value={problemSet.id}>
                              {problemSet.title} ({problemSet.problems?.length || 0} problems)
                            </option>
                          ))}
                        </select>
                        {props.formErrors.problemSetId && (
                          <p className="mt-2 text-sm text-red-600">{props.formErrors.problemSetId}</p>
                        )}
                      </div>

                      {/* Assignment Title */}
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Assignment Title *
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={props.formData.title}
                          onChange={(e) => props.handleFieldChange('title', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            props.formErrors.title ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter assignment title"
                          required
                        />
                        {props.formErrors.title && (
                          <p className="mt-2 text-sm text-red-600">{props.formErrors.title}</p>
                        )}
                      </div>

                      {/* Assignment Description */}
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          id="description"
                          rows={4}
                          value={props.formData.description}
                          onChange={(e) => props.handleFieldChange('description', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            props.formErrors.description ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter assignment description (optional)"
                        />
                        {props.formErrors.description && (
                          <p className="mt-2 text-sm text-red-600">{props.formErrors.description}</p>
                        )}
                      </div>

                      {/* Due Date */}
                      <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                          Due Date *
                        </label>
                        <input
                          type="date"
                          id="dueDate"
                          value={props.formData.dueDate.split('T')[0]}
                          min={props.getMinDate()}
                          max={props.getMaxDate()}
                          onChange={(e) => props.handleFieldChange('dueDate', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            props.formErrors.dueDate ? 'border-red-300' : 'border-gray-300'
                          }`}
                          required
                        />
                        {props.formErrors.dueDate && (
                          <p className="mt-2 text-sm text-red-600">{props.formErrors.dueDate}</p>
                        )}
                      </div>

                      {/* Max Attempts */}
                      <div>
                        <label htmlFor="maxAttempts" className="block text-sm font-medium text-gray-700">
                          Maximum Attempts
                        </label>
                        <input
                          type="number"
                          id="maxAttempts"
                          min="1"
                          max="999"
                          value={props.formData.maxAttempts || ''}
                          onChange={(e) => props.handleFieldChange('maxAttempts', 
                            e.target.value ? parseInt(e.target.value) : null
                          )}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            props.formErrors.maxAttempts ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Unlimited (leave empty)"
                        />
                        {props.formErrors.maxAttempts && (
                          <p className="mt-2 text-sm text-red-600">{props.formErrors.maxAttempts}</p>
                        )}
                        <p className="mt-2 text-sm text-gray-500">
                          Leave empty for unlimited attempts
                        </p>
                      </div>

                      {/* Target Assignment Section */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Targets</h3>
                        
                        {/* Classes */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign to Classes
                          </label>
                          <div className="space-y-2">
                            {props.formData.classIds.map(classId => (
                              <div key={classId} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                                <span className="text-sm text-gray-700">Class {classId}</span>
                                <button
                                  type="button"
                                  onClick={() => props.handleRemoveClass(classId)}
                                  className="text-red-600 hover:text-red-500"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                          {/* TODO: Add class selector */}
                          <button
                            type="button"
                            className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                          >
                            + Add Class
                          </button>
                        </div>

                        {/* Students */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign to Individual Students
                          </label>
                          <div className="space-y-2">
                            {props.formData.studentIds.map(studentId => (
                              <div key={studentId} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                                <span className="text-sm text-gray-700">Student {studentId}</span>
                                <button
                                  type="button"
                                  onClick={() => props.handleRemoveStudent(studentId)}
                                  className="text-red-600 hover:text-red-500"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                          {/* TODO: Add student selector */}
                          <button
                            type="button"
                            className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                          >
                            + Add Student
                          </button>
                        </div>

                        {/* Target Validation Error */}
                        {props.formErrors.classIds && (
                          <p className="mt-2 text-sm text-red-600">{props.formErrors.classIds}</p>
                        )}
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="mt-8 flex items-center justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => navigate('/assignments')}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="button"
                        onClick={props.handleFormReset}
                        disabled={!props.isDirty}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reset
                      </button>

                      <button
                        type="submit"
                        disabled={!props.isValid || props.submitting}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {props.submitting ? 'Creating...' : 'Create Assignment'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </AssignmentFormContainer>
      </div>
    </FeatureGuard>
  );
};

export default CreateAssignmentPage;