import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

import React from 'react'

export default function ProtectedLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 p-5 w-full">
        <Outlet />
      </div>
    </div>
  )
}
