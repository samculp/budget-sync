import React from 'react'
import { useData } from "../context/DataContext"
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

export default function Dashboard() {
  const { budgets, expenses, isLoadingData } = useData()
  const navigate = useNavigate()

  if (isLoadingData) return (<div>Loading...</div>)

  // Calculate totals
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.totalAmount, 0)
  const totalSpent = expenses
    .filter(expense => expense.budgetId?._id) // Only count expenses that are part of a budget
    .reduce((sum, expense) => sum + expense.amount, 0)
  const remainingAmount = totalBudget - totalSpent
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const remainingPercentage = totalBudget > 0 ? (remainingAmount / totalBudget) * 100 : 0

  // Get recent budgets and expenses
  const recentBudgets = [...budgets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  const recentExpenses = [...expenses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  // Calculate spent amount for each budget
  const getBudgetSpent = (budget) => {
    return expenses
      .filter(expense => expense.budgetId?._id === budget._id)
      .reduce((sum, expense) => sum + expense.amount, 0)
  }

  return (
    <div className="p-6">
      {/* Header */ }
      <div className='flex justify-between items-start mb-6'>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button 
          onClick={() => navigate('/budgets/new')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          <Plus className="h-4 w-4" />
          Add Budget
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Budgets Card */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Budgets</h2>
          <p className="text-3xl font-bold">${totalBudget.toFixed(2)}</p>
          <p className="text-gray-500 mt-2">Across {budgets.length} budget{budgets.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Total Spent Card */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Spent</h2>
          <p className="text-3xl font-bold text-red-600">${totalSpent.toFixed(2)}</p>
          <p className="text-gray-500 mt-2">{spentPercentage.toFixed(1)}% of total budget</p>
        </div>

        {/* Remaining Amount Card */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Remaining</h2>
          <p className="text-3xl font-bold text-green-600">${remainingAmount.toFixed(2)}</p>
          <p className="text-gray-500 mt-2">{remainingPercentage.toFixed(1)}% of total budget</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Budgets Card */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Your Budgets</h2>
          </div>
          <div className="space-y-4 mb-4">
            {recentBudgets.map(budget => {
              const spent = getBudgetSpent(budget)
              const progress = (spent / budget.totalAmount) * 100
              return (
                <div 
                  key={budget._id} 
                  className="cursor-pointer hover:bg-gray-50 p-4 rounded-md transition-colors border border-gray-300"
                  onClick={() => navigate(`/budgets/${budget._id}`)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-medium text-gray-800">{budget.name}</p>
                    <p className="text-sm text-gray-500">${spent.toFixed(2)} / ${budget.totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
          <button 
            onClick={() => navigate('/budgets')}
            className="w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-green-100 transition-colors"
          >
            View All Budgets
          </button>
        </div>

        {/* Recent Expenses Card */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Recent Expenses</h2>
          </div>
          <div className="space-y-3 mb-4">
            {recentExpenses.map(expense => (
              <div key={expense._id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-800">{expense.description}</p>
                  <p className="text-sm text-gray-500">{expense.budgetId?.name || 'No Budget'}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${expense.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{new Date(expense.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate('/expenses')}
            className="w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-green-100 transition-colors"
          >
            View All Expenses
          </button>
        </div>
      </div>
    </div>
  )
}
