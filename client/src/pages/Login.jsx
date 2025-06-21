import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from "react-router-dom"
import { useState } from 'react'
import Input from "../components/Input"
import { useEffect } from 'react'

export default function Login() {
  const { authenticate, errorMessage, setErrorMessage, setIsRegistering, isAuthenticated, isAuthenticating } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await authenticate("login", email, password)
      navigate("/dashboard")
    } catch (error) {
      console.error(error.message)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Login</h2>
        {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
        <form onSubmit={handleSubmit}>
          <Input 
            label="Email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <Input 
            label="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button 
            type="submit"
            disabled={isAuthenticating}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            {isAuthenticating ? "Authenticating..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-gray-600">
          Don't have an account? 
          <span 
            className="text-green-600 cursor-pointer hover:underline" 
            onClick={() => {
              navigate('/signup')
              setIsRegistering(true)
              setErrorMessage("")
            }}
          >
            {' '}Sign up
          </span>
        </p>
      </div>
    </div>
  );
}
