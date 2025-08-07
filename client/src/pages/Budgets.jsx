import React, { useState } from 'react'
import { useData } from '../context/DataContext'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

export default function Budgets() {
  const { budgets } = useData()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBudgets = budgets.filter(budget => 
    budget.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Budgets</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search budgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button 
            onClick={() => navigate('/budgets/new')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Budget
          </button>
        </div>
      </div>

      {filteredBudgets.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 text-lg">You don't currently have any budgets</p>
          <p className="text-gray-400 text-sm mt-2">Create your first budget to start tracking your expenses and managing your finances.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBudgets.map((budget) => {
            const remaining = budget.totalAmount - budget.spent
            const percentageSpent = (budget.spent / budget.totalAmount) * 100

            return (
              <div key={budget._id} 
                onClick={() => navigate(`/budgets/${budget._id}`)}
                className="bg-white rounded-lg shadow-md p-6 border-1 border-solid border-gray-300 cursor-pointer hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{budget.name}</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">${budget.totalAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Spent:</span>
                    <span className="font-medium">${budget.spent?.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining:</span>
                    <span className={`font-medium ${remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      ${remaining.toFixed(2)}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(percentageSpent, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-sm text-gray-500 text-right">
                    {percentageSpent.toFixed(1)}% spent
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
