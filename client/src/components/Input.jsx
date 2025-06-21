import React from 'react'

export default function Input(props) {
  const { label, type="text", value, onChange } = props

  return (
    <div className="mb-4">
      <label className="block text-gray-700 font-medium mb-2">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-green-500"
      />
    </div>
  )
}
