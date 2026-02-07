// components/LogoutButton.tsx
"use client"

import { useState } from 'react'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    
    // 1. Panggil API Server yang baru kita buat untuk menghapus cookie
    await fetch('/auth/signout', {
      method: 'POST',
    })

    // 2. Paksa browser pindah halaman (Hard Refresh)
    // Ini penting agar Middleware membaca ulang kondisi terbaru
    window.location.href = '/login'
  }

  return (
    <button 
      onClick={handleLogout}
      disabled={loading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg text-white
        ${loading ? 'bg-gray-500 cursor-wait' : 'bg-red-600 hover:bg-red-700'}
      `}
    >
      <LogOut size={16} />
      <span>{loading ? 'Keluar...' : 'Keluar'}</span>
    </button>
  )
}