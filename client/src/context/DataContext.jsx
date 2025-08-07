import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const DataContext = createContext()

export function useData() {
  return useContext(DataContext)
}

export default function DataProvider(props) {
  const { children } = props
  const { isAuthenticated, authToken, apiBase, user } = useAuth()

  const [budgets, setBudgets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [invites, setInvites] = useState([])
  const [collaborators, setCollaborators] = useState([])
  const [settings, setSettings] = useState({})
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Function to fetch expenses for a specific budget
  const fetchBudgetExpenses = async (budget) => {
    try {
      // Fetch all expenses for this budget using the budget-specific endpoint
      const response = await fetch(`${apiBase}expenses/budget/${budget._id}`, {
        headers: {
          "Authorization": authToken,
        }
      })
      
      if (response.ok) {
        const expenseResults = await response.json()
        return expenseResults
      } else {
        console.error('Error fetching expenses for budget:', budget._id)
        return []
      }
    } catch (error) {
      console.error('Error fetching expenses for budget:', budget._id, error)
      return []
    }
  }

  // get user data upon authentication
  useEffect(() => {
    async function fetchData() {
      if (isAuthenticated && user) {
        try {
          setIsLoadingData(true)

          const budgetResult = await fetch(`${apiBase}budgets/`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": authToken,
            }
          })
          const expensesResult = await fetch(`${apiBase}expenses/`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": authToken,
            }
          })
          const invitesResult = await fetch(`${apiBase}invites/?email=${encodeURIComponent(user.email)}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": authToken,
            }
          })

          const budgetsData = await budgetResult.json()
          const expensesData = await expensesResult.json()
          const invitesData = await invitesResult.json()

          // Fetch expenses for each budget and populate the expenses array
          const budgetsWithExpenses = await Promise.all(
            budgetsData.map(async (budget) => {
              const budgetExpenses = await fetchBudgetExpenses(budget)
              return {
                ...budget,
                expenses: budgetExpenses // Replace expense IDs with actual expense objects
              }
            })
          )

          setBudgets(budgetsWithExpenses)
          setExpenses(expensesData)
          setInvites(invitesData)

        } catch (error) {
          console.error(error.message)
        } finally {
          setIsLoadingData(false)
        }
      }
    }
    fetchData()
  }, [isAuthenticated, user])

  const value = {
    budgets, setBudgets, expenses, setExpenses, invites, setInvites, isLoadingData
  }

  return (
    <div>
      <DataContext.Provider value={value}>
        {children}
      </DataContext.Provider>
    </div>
  )
}
