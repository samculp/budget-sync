import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import React from 'react'

export default function ProtectedRoute(props) {
  const { children } = props
  const { isAuthenticated, isRegistering, isLoading } = useAuth()

  if (isLoading) {
    return (<div className="flex justify-center items-center h-screen text-2xl">Loading...</div>)
  }

  return isAuthenticated ? children : <Navigate to="/login" />
}
