import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider(props) {
  const { children, apiBase } = props

  const [authToken, setAuthToken] = useState(localStorage.getItem("token"))
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function authenticate(extension, email, password, name) {
    localStorage.removeItem("token")
    const reqBody = {email, password, name}
    try {
      setIsAuthenticating(true)
      setErrorMessage("")
      const response = await fetch(`${apiBase}users/${extension}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody)
      })
      const data = await response.json()
      if (data.token) {
        setAuthToken(data.token)
        localStorage.setItem("token", data.token)
        // Fetch user info
        const userResponse = await fetch(`${apiBase}users/profile`, {
          headers: {
            "Authorization": data.token
          }
        })
        const userData = await userResponse.json()
        setUser({ name: userData.name, email: userData.email })
      } else {
        setErrorMessage(data.error)
        throw Error(data.error || "Failed to authenticate")
      }
    } catch (error) {
      console.error(error.message)
    } finally {
      setIsAuthenticating(false)
    }
  }

  function logout() {
    setAuthToken(null)
    setUser(null)
    localStorage.removeItem("token")
  }

  useEffect(() => {
    async function validateSession() {
      try {
        // get the reboot-id from local storage
        const { rebootId: serverRebootId } = await fetch(`${apiBase}reboot-id`)
          .then(res => res.json())
        
        const storedRebootId = localStorage.getItem('serverRebootId')
        const token = localStorage.getItem('token')

        // if the user has a token from the current server session, authenticate them
        // else, get new reboot-id and log them out
        if (token && serverRebootId === storedRebootId) {
          setAuthToken(token)
          // Fetch user info
          const userResponse = await fetch(`${apiBase}users/profile`, {
            headers: {
              "Authorization": token
            }
          })
          const userData = await userResponse.json()
          setUser({ name: userData.name, email: userData.email })
        } else {
          localStorage.setItem('serverRebootId', serverRebootId)
          logout()
        }
      } catch (error) {
        console.error('Server connection error:', error.message)
        setErrorMessage('Server is currently offline!')
        logout()
      } finally {
        setIsLoading(false)
      }
    }
    validateSession()
  }, [])

  const isAuthenticated = !!authToken
  
  const value = {
    apiBase,
    authToken,
    user, setUser,
    isAuthenticated,
    isAuthenticating,
    isRegistering, setIsRegistering,
    errorMessage, setErrorMessage,
    authenticate,
    logout
  }

  return (
    <div>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </div>
  )
}
