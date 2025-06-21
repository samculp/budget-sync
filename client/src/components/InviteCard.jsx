import React from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'

export default function InviteCard({ invite }) {
  const { setInvites, setBudgets } = useData()
  const { authToken, apiBase } = useAuth()

  const handleInviteResponse = async (inviteId, status) => {
    try {
      const response = await fetch(`${apiBase}invites/${inviteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authToken,
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        // Remove the invite from the list since it's no longer pending
        setInvites(prevInvites => prevInvites.filter(invite => invite._id !== inviteId))
        
        // If accepted, refresh budgets to show the new budget
        if (status === 'Accepted') {
          try {
            const budgetsResponse = await fetch(`${apiBase}budgets/`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": authToken,
              }
            })
            if (budgetsResponse.ok) {
              const updatedBudgets = await budgetsResponse.json()
              setBudgets(updatedBudgets)
            }
          } catch (error) {
            console.error('Error refreshing budgets:', error)
          }
        }
      } else {
        console.log("Invite rejected")
      }
    } catch (error) {
      console.error('Error updating invite:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 text-lg">
            Invitation to join "{invite.budgetId?.name || 'Budget'}"
          </h3>
          {invite.customMessage && (
            <p className="text-gray-600 text-sm mt-2">{invite.customMessage}</p>
          )}
          <p className="text-gray-500 text-xs mt-2">
            Invited on {new Date(invite.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleInviteResponse(invite._id, 'Accepted')}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1"
        >
          Accept
        </button>
        <button
          onClick={() => handleInviteResponse(invite._id, 'Declined')}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1"
        >
          Decline
        </button>
      </div>
    </div>
  )
} 