// src/app/login/page.tsx
"use client"

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr' // Kita pakai client langsung di sini biar aman
import { useRouter } from 'next/navigation'
import { LockKeyhole } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    
    // Inisialisasi client Supabase manual di sini
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg("Email atau Password salah.")
      setLoading(false)
    } else {
      // Login berhasil, paksa refresh ke halaman utama
      router.refresh()
      router.push('/') 
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-200">
        
        {/* Header Login */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-full mb-4 shadow-lg shadow-blue-200">
            <LockKeyhole className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Admin Login</h1>
          <p className="text-gray-500 text-sm mt-1">Masuk Roti Maul System</p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-5">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-medium border border-red-100">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Email</label>
            <input 
              type="email" 
              required
              placeholder="admin@rotimaul.com"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition outline-none text-gray-900"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition outline-none text-gray-900"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-blue-700 text-white py-3.5 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg shadow-blue-200 disabled:opacity-70"
          >
            {loading ? 'Memverifikasi...' : 'Masuk Dashboard'}
          </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
                Akses terbatas. IP Anda tercatat.
            </p>
        </div>
      </div>
    </div>
  )
}