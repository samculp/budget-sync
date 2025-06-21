import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Send, X } from 'lucide-react'

export default function NewInvite() {
  const { budgets } = useData()
  const { authToken, apiBase, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get budget from location state if navigating from BudgetDetails
  const preSelectedBudget = location.state?.budget
  
  const [formData, setFormData] = useState({
    budgetId: preSelectedBudget?._id || '',
    invitedEmail: '',
    customMessage: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Set the budget if pre-selected
  useEffect(() => {
    if (preSelectedBudget) {
      setFormData(prev => ({
        ...prev,
        budgetId: preSelectedBudget._id
      }))
    }
  }, [preSelectedBudget])

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    if (formData.invitedEmail === user.email) {
      setError('You cannot send an invite to yourself!')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(`${apiBase}invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({
          budgetId: formData.budgetId,
          invitedEmail: formData.invitedEmail,
          customMessage: formData.customMessage
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send invite')
      }

      const result = await response.json()
      
      if (result.emailSent) {
        setSuccess('Invite successful! An email has been sent to that user.')
      } else {
        setSuccess('Invite created but email delivery failed. Please try again later.')
        console.error('Email error:', result.emailError)
      }
      
      setFormData({
        budgetId: preSelectedBudget?._id || '',
        invitedEmail: '',
        customMessage: ''
      })
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="p-6">
      {/* Header with back button */}
      {preSelectedBudget ? (
        <div className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft 
          className="h-5 w-5 cursor-pointer" 
          onClick={() => navigate(`/budgets/${preSelectedBudget._id}`)} 
        />
        <span 
          className="cursor-pointer" 
          onClick={() => navigate(`/budgets/${preSelectedBudget._id}`)}
        >
          Back to Budget
        </span>
      </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft 
          className="h-5 w-5 cursor-pointer" 
          onClick={() => navigate('/collaborate')} 
        />
        <span 
          className="cursor-pointer" 
          onClick={() => navigate('/collaborate')}
        >
          Back to Collaborate
        </span>
      </div>
      )}
      

      {/* Main content */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 border border-gray-300">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Send Invite</h1>
          <p className="text-gray-600 mb-8">
            Invite someone to collaborate on a budget
          </p>

          {/* Success/Error messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Budget Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Budget *
              </label>
              <select
                name="budgetId"
                value={formData.budgetId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              >
                <option value="">Choose a budget</option>
                {budgets.map(budget => (
                  <option key={budget._id} value={budget._id}>
                    {budget.name} - ${budget.totalAmount.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="invitedEmail"
                value={formData.invitedEmail}
                onChange={handleInputChange}
                required
                placeholder="Enter the email address of the person you want to invite"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              />
            </div>

            {/* Custom Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Message (Optional)
              </label>
              <textarea
                name="customMessage"
                value={formData.customMessage}
                onChange={handleInputChange}
                placeholder="Add a personal message to your invite..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                This message will be included in the invitation email
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/budgets/${preSelectedBudget._id}`)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Invite
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
