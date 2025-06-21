import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Edit, Trash2, Users, Plus, MoreVertical, X, LogOut } from 'lucide-react'

export default function BudgetDetails() {
  const { budgets, setBudgets, setExpenses } = useData()
  const { authToken, apiBase } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState(null)
  const [localExpenses, setLocalExpenses] = useState([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false)
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false)
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false)
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false)
  const [showLeaveConfirmationModal, setShowLeaveConfirmationModal] = useState(false)
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false)
  const [collaborators, setCollaborators] = useState([])
  const [editedExpense, setEditedExpense] = useState({
    amount: '',
    category: '',
    description: '',
    expenseId: ''
  })
  const [editBudget, setEditBudget] = useState({
    name: '',
    description: '',
    totalAmount: ''
  })
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    category: ''
  })

  const categories = ['Food', 'Rent', 'Travel', 'Entertainment', 'Utility', 'Other']

  const budget = budgets.find(b => b._id === id)

  async function deleteBudget() {
    try {
      const response = await fetch(`${apiBase}budgets/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": authToken
        }
      })      
      // Update local budgets state by filtering out the deleted budget
      setBudgets(budgets.filter(b => b._id !== id))
      navigate('/budgets')
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  async function leaveBudget() {
    try {
      const response = await fetch(`${apiBase}budgets/${id}/leave`, {
        method: "PUT",
        headers: {
          "Authorization": authToken
        }
      })
      
      if (response.ok) {
        // Update local budgets state by filtering out the left budget
        setBudgets(budgets.filter(b => b._id !== id))
        navigate('/budgets')
      } else {
        console.error('Error leaving budget:', await response.text())
      }
    } catch (error) {
      console.error('Error leaving budget:', error)
    }
  }

  async function handleDeleteExpense(expenseId) {
    try {
      const response = await fetch(`${apiBase}expenses/${expenseId}`, {
        method: "DELETE",
        headers: {
          "Authorization": authToken
        }
      })

      // Get the expense being deleted to subtract its amount
      const deletedExpense = localExpenses.find(e => e._id === expenseId)
      
      // Update local expenses state
      setLocalExpenses(localExpenses.filter(e => e._id !== expenseId))
      
      // Update local budgets state to remove expense from budget's expenses array
      // and update the spent amount
      const updatedBudgets = budgets.map(b => {
        if (b._id === budget._id) {
          return {
            ...b,
            expenses: b.expenses.filter(e => e !== expenseId),
            spent: b.spent - (deletedExpense?.amount || 0)
          }
        }
        return b
      })
      setBudgets(updatedBudgets)
      
      // Update the budget in the database with new spent amount
      await fetch(`${apiBase}budgets/${budget._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify({ 
          spent: budget.spent - (deletedExpense?.amount || 0)
        })
      })

      const expensesResult = await fetch(`${apiBase}expenses/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authToken,
        }
      })
      setExpenses(await expensesResult.json())
      
      setActiveMenu(null) // Close the dropdown menu
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  async function handleAddExpense(e) {
    e.preventDefault()
    try {
      // Add expense to DB
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
          budgetId: id
        })
      })

      if (!response.ok) throw new Error('Failed to create expense')
      
      const createdExpense = await response.json()
      
      // Update local expenses state
      setLocalExpenses([...localExpenses, createdExpense])
      
      // Calculate new spent amount
      const newSpentAmount = (budget.spent || 0) + parseFloat(newExpense.amount)
      
      // Update local budgets state to include new expense and update spent amount
      const updatedBudgets = budgets.map(b => {
        if (b._id === id) {
          return {
            ...b,
            expenses: [...b.expenses, createdExpense._id],
            spent: newSpentAmount
          }
        }
        return b
      })
      setBudgets(updatedBudgets)
      
      // Update the budget in the database with new spent amount
      await fetch(`${apiBase}budgets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify({ 
          spent: newSpentAmount
        })
      })

      // Reset global expenses
      const expensesResult = await fetch(`${apiBase}expenses/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authToken,
        }
      })
      setExpenses(await expensesResult.json())
      
      setShowAddExpenseModal(false)
      setNewExpense({ amount: '', description: '', category: '' })
    } catch (error) {
      console.error('Error creating expense:', error)
    }
  }

  async function handleEditExpense(e) {
    e.preventDefault()
    try {
      // Optimistically update local state first
      const updatedExpense = {
        ...editedExpense,
        amount: parseFloat(editedExpense.amount),
        category: editedExpense.category || 'Other'
      }

      // Update local expenses immediately
      const updatedLocalExpenses = localExpenses.map(expense => 
        expense._id === editedExpense.expenseId ? updatedExpense : expense
      )
      setLocalExpenses(updatedLocalExpenses)

      // Calculate new total spent amount
      const newTotalSpent = updatedLocalExpenses.reduce((sum, expense) => sum + expense.amount, 0)

      // Update local budgets state immediately
      const updatedBudgets = budgets.map(b => {
        if (b._id === id) {
          return {
            ...b,
            spent: newTotalSpent
          }
        }
        return b
      })
      setBudgets(updatedBudgets)

      console.log("OBJECT: ", updatedExpense)
      
      // Make API calls in parallel
      const [expenseResponse, budgetResponse] = await Promise.all([
        // Update expense
        fetch(`${apiBase}expenses/${updatedExpense.expenseId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken
          },
          body: JSON.stringify({
            amount: updatedExpense.amount,
            description: updatedExpense.description,
            category: updatedExpense.category,
            budgetId: id
          })
        }),
        // Update budget spent amount
        fetch(`${apiBase}budgets/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken
          },
          body: JSON.stringify({ spent: newTotalSpent })
        })
      ])

      if (!expenseResponse.ok || !budgetResponse.ok) {
        throw new Error('Failed to update expense or budget')
      }

      // Update global expenses state only if needed
      const [expenseData] = await Promise.all([
        expenseResponse.json()
      ])
      
      // Update global expenses state with the new expense data
      setExpenses(prevExpenses => 
        prevExpenses.map(expense => 
          expense._id === editedExpense.expenseId ? expenseData : expense
        )
      )

      // Reset form and close modal
      setShowEditExpenseModal(false)
      setEditedExpense({ amount: '', description: '', category: '', expenseId: '' })
    } catch (error) {
      console.error('Error editing expense:', error)
    }
  }

  async function handleEditBudget(e) {
    e.preventDefault()
    try {
      const response = await fetch(`${apiBase}budgets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({
          ...editBudget,
          totalAmount: parseFloat(editBudget.totalAmount)
        })
      })

      if (!response.ok) throw new Error('Failed to update budget')
      
      const updatedBudget = await response.json()
      
      // Update local budgets state
      const updatedBudgets = budgets.map(b => 
        b._id === id ? updatedBudget : b
      )
      setBudgets(updatedBudgets)
      
      setShowEditBudgetModal(false)
    } catch (error) {
      console.error('Error updating budget:', error)
    }
  }

  function toggleMenu(expenseId) {
    setActiveMenu(activeMenu === expenseId ? null : expenseId)
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

  // Fetch expenses on component mount or expenses update
  useEffect(() => {
    async function fetchExpenses() {
      // If no expenses, return
      if (!budget?.expenses?.length) {
        setIsLoadingExpenses(false)
        return
      }

      try {
        setIsLoadingExpenses(true)
        // Get all expenses for budget
        const expensePromises = budget.expenses.map(expenseId => 
          fetch(`${apiBase}expenses/${expenseId}`, {
            headers: {
              "Authorization": authToken,
            }
          }).then(res => res.json())
        )
        
        const expenseResults = await Promise.all(expensePromises)
        setLocalExpenses(expenseResults)

        // Calculate total spent from expenses
        const totalSpent = expenseResults.reduce((sum, expense) => sum + expense.amount, 0)
        
        // Only update if the spent amount has changed
        if (budget.spent !== totalSpent) {
          // Update the budget's spent amount in the budgets array
          const updatedBudgets = budgets.map(b => 
            b._id === budget._id ? { ...b, spent: totalSpent } : b
          )
          setBudgets(updatedBudgets)

          // Update the budget in the database
          try {
            const response = await fetch(`${apiBase}budgets/${budget._id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken,
              },
              body: JSON.stringify({ spent: totalSpent })
            })
          } catch (error) {
            console.error('Error updating budget in database:', error)
          }
        }
      } catch (error) {
        console.error('Error fetching expenses:', error)
      } finally {
        setIsLoadingExpenses(false)
      }
    }
    async function getCollaborators() {
      try {
        const response = await fetch(`${apiBase}budgets/${id}/collaborators`, {
          method: "GET",
          headers: {
            "Authorization": authToken,
          }
        })
        
        if (response.ok) {
          const collaboratorsData = await response.json()
          setCollaborators(collaboratorsData)
        } else {
          console.error('Error fetching collaborators:', await response.text())
        }
      } catch (error) {
        console.error('Error fetching collaborators:', error)
      }
    }
    fetchExpenses()
    getCollaborators()
  }, [id, authToken, apiBase, budget?.expenses])


  if (!budget) {
    return (
      <div className="p-6">
        <button 
          onClick={() => navigate('/budgets')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Budgets
        </button>
        <div className="text-red-500">Budget not found</div>
      </div>
    )
  }

  const remaining = budget.totalAmount - (budget.spent || 0)
  const percentageSpent = ((budget.spent || 0) / budget.totalAmount) * 100

  return (
    <div className="p-6">
      {/* Header with back button */}
      <div className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => navigate('/budgets')} />
        <span className="cursor-pointer" onClick={() => navigate('/budgets')}>Back to Budgets</span>
      </div>

      {/* Title section with action buttons */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{budget.name}</h1>
          <p className="text-gray-600 mt-2">{budget.description || 'No description provided'}</p>
        </div>
        <div className="flex gap-4">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            onClick={() => {
              setEditBudget({
                name: budget.name,
                description: budget.description || '',
                totalAmount: budget.totalAmount
              })
              setShowEditBudgetModal(true)
            }}
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            onClick={() => setShowDeleteConfirmationModal(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            onClick={() => setShowLeaveConfirmationModal(true)}
          >
            <LogOut className="h-4 w-4" />
            Leave Budget
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Budget Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-1 border-solid border-gray-300">
          <h3 className="text-gray-600 mb-2">Total Budget</h3>
          <p className="text-2xl font-bold text-gray-800">${budget.totalAmount.toFixed(2)}</p>
        </div>

        {/* Spent Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-1 border-solid border-gray-300">
          <h3 className="text-gray-600 mb-2">Spent</h3>
          <p className="text-2xl font-bold text-gray-800">${budget.spent?.toFixed(2)}</p>
        </div>

        {/* Remaining Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-1 border-solid border-gray-300">
          <h3 className="text-gray-600 mb-2">Remaining</h3>
          <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
            ${remaining.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Progress bar section */}
      <div className="bg-white rounded-lg shadow-md p-6 border-1 border-solid border-gray-300 mb-8">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Budget Progress</h3>
          <span className="text-gray-600">{percentageSpent.toFixed(1)}% spent</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-green-600 h-4 rounded-full" 
            style={{ width: `${Math.min(percentageSpent, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Expenses section */}
      <div className="bg-white rounded-lg shadow-md p-6 border-1 border-solid border-gray-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
          <div className="flex gap-4">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
              onClick={() => setShowCollaboratorsModal(true)}
            >
              <Users className="h-4 w-4" />
              Collaborators
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              onClick={() => setShowAddExpenseModal(true)}
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Expense History Table */}
        <div className="overflow-x-auto">
          {isLoadingExpenses ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading expenses...</p>
            </div>
          ) : localExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No expenses found for this budget
            </div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Category</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Amount</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {localExpenses.map((expense, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{expense.description}</td>
                    <td className="py-3 px-4">{new Date(expense.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{expense.category}</td>
                    <td className="py-3 px-4">${expense.amount.toFixed(2)}</td>
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
                              index === localExpenses.length - 1 ? 'bottom-0 mb-2' : 'top-0 mt-2'
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
                                  console.log("New edited expense:", newEditedExpense)
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

      {/* Edit Budget Modal */}
      {showEditBudgetModal && (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-10">
          <div className="bg-white border-1 border-gray-300 rounded-lg p-6 w-full max-w-md relative z-20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Budget</h2>
              <button 
                onClick={() => setShowEditBudgetModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Name
                </label>
                <input
                  type="text"
                  required
                  value={editBudget.name}
                  onChange={(e) => setEditBudget({...editBudget, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter budget name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editBudget.description}
                  onChange={(e) => setEditBudget({...editBudget, description: e.target.value})}
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
                  value={editBudget.totalAmount}
                  onChange={(e) => setEditBudget({...editBudget, totalAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditBudgetModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collaborators Modal */}
      {showCollaboratorsModal && (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-10">
          <div className="bg-white border-1 border-gray-300 rounded-lg p-6 w-full max-w-md relative z-20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Collaborators</h2>
              <button 
                onClick={() => setShowCollaboratorsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto mb-4">
              {collaborators.length > 0 ? 
              collaborators.map((collaborator, index) => (
                <div key={index} className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
                  <p>{collaborator.name}</p>
                  <p>{collaborator.email}</p>
                </div>
              )) : (
                <p>This budget has no collaborators!</p>
              )}
            </div>

            <button className="bg-green-600 text-white rounded-md hover:bg-green-700 w-full py-2 px-4"
              onClick={() => navigate('/collaborate/invite', { state: { budget } })}>
              <span className="flex items-center gap-2 justify-center">
                <Plus className="h-4 w-4" />
                Add Collaborator
              </span>
            </button>

          </div>
        </div>
      )}

      {/* Leave Budget Confirmation Modal */}
      {showLeaveConfirmationModal && (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-10">
          <div className="bg-white border-1 border-gray-300 rounded-lg p-6 w-full max-w-md relative z-20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Leave Budget</h2>
              <button 
                onClick={() => setShowLeaveConfirmationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to leave the budget "<strong>{budget?.name}</strong>"?
              </p>
              <p className="text-gray-600 text-sm">
                You will no longer have access to this budget, but it will remain available to other members.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLeaveConfirmationModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLeaveConfirmationModal(false)
                  leaveBudget()
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Leave Budget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Budget Confirmation Modal */}
      {showDeleteConfirmationModal && (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-10">
          <div className="bg-white border-1 border-gray-300 rounded-lg p-6 w-full max-w-md relative z-20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Delete Budget</h2>
              <button 
                onClick={() => setShowDeleteConfirmationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the budget "<strong>{budget?.name}</strong>"?
              </p>
              <p className="text-red-600 text-sm">
                This action cannot be undone. The budget and all its expenses will be permanently deleted for all members.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirmationModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirmationModal(false)
                  deleteBudget()
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}