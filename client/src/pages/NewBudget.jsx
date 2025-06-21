import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { ArrowLeft } from 'lucide-react'

export default function NewBudget() {
  const navigate = useNavigate()
  const { authToken, apiBase } = useAuth()
  const { setBudgets } = useData()
  const [newBudget, setNewBudget] = useState({
    name: '',
    description: '',
    totalAmount: '',
    expenses: []
  })

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const response = await fetch(`${apiBase}budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({
          ...newBudget,
          totalAmount: parseFloat(newBudget.totalAmount)
        })
      })
      
      const createdBudget = await response.json()
      
      // Update local budgets state
      setBudgets(prevBudgets => [...prevBudgets, createdBudget])
      
      // Navigate to the new budget's page
      navigate(`/budgets/${createdBudget._id}`)
    } catch (error) {
      console.error('Error creating budget:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => navigate('/budgets')} />
        <span className="cursor-pointer" onClick={() => navigate('/budgets')}>Back to Budgets</span>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Budget</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Name
            </label>
            <input
              type="text"
              required
              value={newBudget.name}
              onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter budget name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newBudget.description}
              onChange={(e) => setNewBudget({...newBudget, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter budget description"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Amount
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={newBudget.totalAmount}
              onChange={(e) => setNewBudget({...newBudget, totalAmount: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/budgets')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 