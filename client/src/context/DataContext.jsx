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
          const collaboratorsResult = null
          const settingsResult = null

          setBudgets(await budgetResult.json())
          setExpenses(await expensesResult.json())
          setInvites(await invitesResult.json())

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
