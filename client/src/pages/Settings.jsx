import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Save, X } from 'lucide-react'

export default function Settings() {
  const { user, authToken, apiBase, setUser } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [passError, setPassError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Initialize form data with current user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      })
    }
  }, [user])

  async function handleProfileUpdate(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${apiBase}users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const updatedUser = await response.json()
      setUser({ name: updatedUser.name, email: updatedUser.email })
      setSuccess('Profile updated successfully!')
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setPassError('')
    setSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPassError('New passwords do not match')
      setIsSubmitting(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(`${apiBase}users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({
          password: passwordData.newPassword
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update password')
      }

      setSuccess('Password updated successfully!')
      setShowPasswordModal(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      setPassError(error.message)
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

  function handlePasswordInputChange(e) {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="p-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>

      {/* Main content */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 border border-gray-300">
          <p className="text-gray-600 mb-8">
            Manage your account settings and preferences
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

          {/* Profile Information Form */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Password Section */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Password</h2>
            <p className="text-gray-600 mb-4">
              Update your password to keep your account secure
            </p>
            <button
              onClick={() => {
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                })
                setShowPasswordModal(true)
                setError('')
                setPassError('')
                setSuccess('')
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-10">
          <div className="bg-white border-1 border-gray-300 rounded-lg p-6 w-full max-w-md relative z-20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Change Password</h2>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {passError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {passError}
            </div>
            )}
            
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 