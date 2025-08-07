import { Navigate, BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthProvider from './context/AuthContext'
import DataProvider from "./context/DataContext"
import ProtectedRoute from './components/ProtectedRoute'

import Login from "./pages/Login"
import Dashboard from './pages/Dashboard'
import Budgets from './pages/Budgets'
import BudgetDetails from './pages/BudgetDetails'
import NewBudget from './pages/NewBudget'
import ProtectedLayout from './components/ProtectedLayout'
import Signup from './pages/Signup'
import Expenses from "./pages/Expenses"
import Collaborate from "./pages/Collaborate"
import Settings from "./pages/Settings"
import NewInvite from './pages/NewInvite'

export default function App() {
  const apiBase = import.meta.env.VITE_API_BASE
  return (
    <AuthProvider {...{ apiBase }}>
      <Router>
        <Routes>
          {/* public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <DataProvider>
                  <ProtectedLayout />
                </DataProvider>
              </ProtectedRoute>
            }>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/budgets/new" element={<NewBudget />} />
              <Route path="/budgets/:id" element={<BudgetDetails />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/collaborate" element={<Collaborate />} />
              <Route path="/collaborate/invite" element={<NewInvite />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}
