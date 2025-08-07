import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { Edit, Trash2, MoreVertical, Plus, Search, X } from 'lucide-react'

export default function Expenses() {
  const navigate = useNavigate()
  const { expenses, setExpenses, isLoadingData, budgets, setBudgets } = useData()
  const { authToken, apiBase } = useAuth()
  const [activeMenu, setActiveMenu] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false)
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false)
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    category: '',
    budgetId: ''
  })
  const [editedExpense, setEditedExpense] = useState({
    amount: '',
    category: '',
    description: '',
    expenseId: ''
  })

  const categories = ['Food', 'Rent', 'Travel', 'Entertainment', 'Utility', 'Other']

  const filteredExpenses = expenses.filter(expense => 
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getBudgetName(expense.budgetId).toLowerCase().includes(searchQuery.toLowerCase())
  ).reverse();

  async function handleDeleteExpense(expenseId) {
    try {
      // First, get the expense details before deleting
      const expenseToDelete = expenses.find(e => e._id === expenseId)
      if (!expenseToDelete) throw new Error('Expense not found')

      // Delete the expense
      const response = await fetch(`${apiBase}expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authToken
        }
      })

      if (!response.ok) throw new Error('Failed to delete expense')
      
      // Update local expenses state
      setExpenses(expenses.filter(e => e._id !== expenseId))
      
      // If the deleted expense had a budget, update the budget's spent amount and expenses array
      if (expenseToDelete.budgetId) {
        // Find the budget in the budgets array
        const budgetIndex = budgets.findIndex(b => b._id === expenseToDelete.budgetId)
        if (budgetIndex !== -1) {
          const updatedSpent = (budgets[budgetIndex].spent || 0) - expenseToDelete.amount
          
          // Update the budget on the server
          const budgetResponse = await fetch(`${apiBase}budgets/${expenseToDelete.budgetId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authToken
            },
            body: JSON.stringify({ spent: updatedSpent })
          })
          
          if (!budgetResponse.ok) throw new Error('Failed to update budget')
          
          const updatedBudget = await budgetResponse.json()
          
          // Update the budget in the budgets array - remove the expense from the expenses array
          setBudgets(budgets.map(b => 
            b._id === updatedBudget._id ? {
              ...updatedBudget,
              expenses: b.expenses.filter(e => e._id !== expenseToDelete._id)
            } : b
          ))
        }
      }
      
      setActiveMenu(null)
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  async function handleAddExpense(e) {
    e.preventDefault()
    try {      
      const response = await fetch(`${apiBase}expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({
          ...newExpense,
          category: (newExpense.category ? newExpense.category : 'Other'),
          amount: parseFloat(newExpense.amount),
          budgetId: newExpense.budgetId === '' ? null : newExpense.budgetId
        })
      })
      
      if (!response.ok) throw new Error('Failed to create expense')
      
      const createdExpense = await response.json()
      
      // Update local expenses state
      setExpenses([...expenses, createdExpense])
      
      // If expense has a budget, update the budget's spent amount and expenses array
      if (createdExpense.budgetId) {        
        // Find the budget in the budgets array
        const budgetIndex = budgets.findIndex(b => b._id === createdExpense.budgetId)
        
        if (budgetIndex !== -1) {
          const updatedSpent = (budgets[budgetIndex].spent || 0) + createdExpense.amount
        
          // Update the budget on the server
          const budgetResponse = await fetch(`${apiBase}budgets/${createdExpense.budgetId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authToken
            },
            body: JSON.stringify({ spent: updatedSpent })
          })
          
          if (!budgetResponse.ok) throw new Error('Failed to update budget')
          
          const updatedBudget = await budgetResponse.json()
          
          // Update the budget in the budgets array - add the new expense to the expenses array
          setBudgets(budgets.map(b => 
            b._id === updatedBudget._id ? {
              ...updatedBudget,
              expenses: [...b.expenses, createdExpense]
            } : b
          ))
        }
      }
      
      setShowAddExpenseModal(false)
      setNewExpense({ amount: '', description: '', category: '', budgetId: '' })
    } catch (error) {
      console.error('Error creating expense:', error)
    }
  }

  async function handleEditExpense(e) {
    e.preventDefault()
    try {
      // Get the original expense to calculate the difference
      const originalExpense = expenses.find(e => e._id === editedExpense.expenseId)
      if (!originalExpense) throw new Error('Expense not found')

      // Update expense in database
      const response = await fetch(`${apiBase}expenses/${editedExpense.expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({
          amount: parseFloat(editedExpense.amount),
          description: editedExpense.description,
          category: editedExpense.category || 'Other',
          budgetId: originalExpense.budgetId
        })
      })

      if (!response.ok) throw new Error('Failed to update expense')
      
      const updatedExpense = await response.json()

      // Update local expenses state
      const updatedExpenses = expenses.map(expense => 
        expense._id === updatedExpense._id ? updatedExpense : expense
      )
      setExpenses(updatedExpenses)

      // If the expense has a budget, update the budget's spent amount
      if (originalExpense.budgetId) {
        // Get all expenses for this budget
        const budgetExpenses = updatedExpenses.filter(e => e.budgetId === originalExpense.budgetId)
        
        // Calculate new total spent for this budget
        const newTotalSpent = budgetExpenses.reduce((sum, expense) => sum + expense.amount, 0)

        // Update the budget on the server
        const budgetResponse = await fetch(`${apiBase}budgets/${originalExpense.budgetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken
          },
          body: JSON.stringify({ spent: newTotalSpent })
        })
        
        if (!budgetResponse.ok) throw new Error('Failed to update budget')
        
        const updatedBudget = await budgetResponse.json()
        
        // Update the budget in the budgets array - update the expense in the expenses array
        setBudgets(budgets.map(b => 
          b._id === updatedBudget._id ? {
            ...updatedBudget,
            expenses: b.expenses.map(e => e._id === updatedExpense._id ? updatedExpense : e)
          } : b
        ))
      }

      // Close modal and reset form
      setShowEditExpenseModal(false)
      setEditedExpense({ amount: '', description: '', category: '', expenseId: '' })
    } catch (error) {
      console.error('Error editing expense:', error)
    }
  }

  function toggleMenu(expenseId) {
    setActiveMenu(activeMenu === expenseId ? null : expenseId)
  }

  // Helper function to get budget name
  function getBudgetName(budgetObj) {
    // If budgetObj is already a string (ID), use it directly
    // If it's an object, get its _id
    const budgetId = typeof budgetObj === 'string' ? budgetObj : budgetObj?._id
    const budget = budgets.find(b => b._id === budgetId)
    return budget ? budget.name : 'No Budget'
  }

  // Close menu when clicking outside
  useEffect(() => {    
    const handleClickOutside = (event) => {
      if (!event.target.closest('.action-menu')) {
        setActiveMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">All Expenses</h1>
          <p>View all of your expenses across all of your budgets</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button 
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border-1 border-solid border-gray-300">
        <div className="overflow-x-auto">
          {isLoadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading expenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              {searchQuery ? 'No expenses match your search' : 'No expenses found'}
            </div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Category</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Budget</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense, index) => (
                  <tr key={expense._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{expense.description}</td>
                    <td className="py-3 px-4">{new Date(expense.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{expense.category}</td>
                    <td className="py-3 px-4">${expense.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">{getBudgetName(expense.budgetId)}</td>
                    <td className="py-3 px-4 text-right relative">
                      <div className="action-menu">
                        <button 
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => toggleMenu(expense._id)}
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeMenu === expense._id && (
                          <div 
                            className={`absolute right-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 ${
                              index === expenses.length - 1 ? 'bottom-0 mb-2' : 'top-0 mt-2'
                            }`}
                          >
                            <div className="py-1">
                              <button
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  setActiveMenu(null)
                                  const newEditedExpense = {
                                    amount: expense.amount,
                                    description: expense.description,
                                    category: expense.category,
                                    expenseId: expense._id
                                  }
                                  setEditedExpense(newEditedExpense)
                                  setShowEditExpenseModal(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                onClick={() => {
                                  setActiveMenu(null)
                                  handleDeleteExpense(expense._id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-10">
          <div className="bg-white border-1 border-gray-300 rounded-lg p-6 w-full max-w-md relative z-20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Expense</h2>
              <button 
                onClick={() => setShowAddExpenseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  required
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget
                </label>
                <select
                  value={newExpense.budgetId}
                  onChange={(e) => setNewExpense({...newExpense, budgetId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">No Budget</option>
                  {budgets.map(budget => (
                    <option key={budget._id} value={budget._id}>
                      {budget.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExpense}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditExpenseModal && (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-10">
          <div className="bg-white border-1 border-gray-300 rounded-lg p-6 w-full max-w-md relative z-20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Existing Expense</h2>
              <button 
                onClick={() => setShowEditExpenseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editedExpense.amount}
                  onChange={(e) => setEditedExpense({...editedExpense, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={editedExpense.description}
                  onChange={(e) => setEditedExpense({...editedExpense, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  required
                  value={editedExpense.category}
                  onChange={(e) => setEditedExpense({...editedExpense, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditExpenseModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditExpense}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Edit Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>

    
  )
}
