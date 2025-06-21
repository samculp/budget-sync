import React from 'react'
import { useData } from '../context/DataContext'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import InviteCard from '../components/InviteCard'

export default function Collaborate() {
  const { invites, isLoadingData } = useData()
  const navigate = useNavigate()

  if (isLoadingData) return (<div>Loading...</div>)

  return (
    <div className='p-6'>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Collaborate</h1>

      {/* Pending Invitations Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Pending Invitations</h2>
          <button 
            onClick={() => navigate('/collaborate/invite')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Send Invite
          </button>
        </div>
        {invites && invites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invites.map((invite) => (
              <InviteCard key={invite._id} invite={invite} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 text-lg">No pending invitations</p>
            <p className="text-gray-400 text-sm mt-2">You'll see invitations here when other users invite you to join their budgets.</p>
          </div>
        )}
      </div>
    </div>
  )
}
