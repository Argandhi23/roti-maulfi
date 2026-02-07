// components/ChangePassword.tsx
"use client"

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ChangePassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
        setStatus({ msg: 'Password minimal 6 karakter', type: 'error' })
        return
    }

    setLoading(true)
    setStatus(null)

    const { error } = await supabase.auth.updateUser({ password: password })

    if (error) {
        setStatus({ msg: 'Gagal mengubah password', type: 'error' })
    } else {
        setStatus({ msg: 'Password berhasil diperbarui!', type: 'success' })
        setPassword('')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mt-6">
        <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-50 p-2 rounded-lg text-orange-500">
                <Lock size={20} />
            </div>
            <h3 className="font-bold text-gray-800">Keamanan Akun</h3>
        </div>

        <form onSubmit={handleUpdate} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full">
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Password Baru</label>
                <input 
                    type="password" 
                    placeholder="Masukkan password baru..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
            </div>
            <button 
                type="submit" 
                disabled={loading || !password}
                className="w-full md:w-auto bg-gray-800 hover:bg-gray-900 text-white font-bold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
                {loading ? <Loader2 className="animate-spin" size={18}/> : "Ubah Sandi"}
            </button>
        </form>

        {status && (
            <div className={`mt-3 text-sm flex items-center gap-2 ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {status.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                {status.msg}
            </div>
        )}
    </div>
  )
}