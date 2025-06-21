import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PiggyBank, LayoutDashboard, Receipt, Users, Settings, LogOut, User } from "lucide-react"

export default function Sidebar() {
  const { logout, user } = useAuth()

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 text-gray-800 fixed">
      <div className="p-5 text-2xl font-bold text-gray-700 border-b border-gray-200 flex items-center gap-2">
        <PiggyBank className="h-6 w-6 text-green-600" />
        <h1 className="font-bold text-xl">Expense Tracker</h1>
      </div>
      <nav className="mt-5 mr-2 ml-2">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => 
            `block py-2 px-4 rounded-md transition ${
              isActive ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
            }`
          }
        >
          <div className="flex items-center gap-2">
            <LayoutDashboard />
            <h1>Dashboard</h1>
          </div>
        </NavLink>
        <NavLink 
          to="/budgets" 
          className={({ isActive }) => 
            `block py-2 px-4 rounded-md transition ${
              isActive ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
            }`
          }
        >
          <div className="flex items-center gap-2">
            <PiggyBank />
            <h1>Budgets</h1>
          </div>
        </NavLink>
        <NavLink 
          to="/expenses" 
          className={({ isActive }) => 
            `block py-2 px-4 rounded-md transition ${
              isActive ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
            }`
          }
        >
          <div className="flex items-center gap-2">
            <Receipt />
            <h1>Expenses</h1>
          </div>
        </NavLink>
        <NavLink 
          to="/collaborate" 
          className={({ isActive }) => 
            `block py-2 px-4 rounded-md transition ${
              isActive ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
            }`
          }
        >
          <div className="flex items-center gap-2">
            <Users />
            <h1>Collaborate</h1>
          </div>
        </NavLink>
        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `block py-2 px-4 rounded-md transition ${
              isActive ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100'
            }`
          }
        >
          <div className="flex items-center gap-2">
            <Settings />
            <h1>Settings</h1>
          </div>
        </NavLink>
      </nav>
      
      {/* User Info */}
      <div className="absolute bottom-20 left-5 right-5 p-4 bg-gray-50 rounded-md border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-5 w-5 text-gray-500" />
          <div>
            <p className="font-medium text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      <button 
        onClick={logout} 
        className="absolute bottom-5 left-5 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex gap-4 items-center"
      >
        <LogOut className='h-6 w-6'/>
        Log Out
      </button>
    </div>
  );
}