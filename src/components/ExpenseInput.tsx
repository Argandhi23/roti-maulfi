"use client"

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Loader2, Wallet } from 'lucide-react'
import Toast from '@/components/Toast'

export default function ExpenseInput() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [item, setItem] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('expenses')
      .insert([{ 
        date, 
        item_name: item, 
        amount: Number(amount) 
      }])

    if (error) {
      setToast({ msg: 'Gagal menyimpan data.', type: 'error' })
    } else {
      setToast({ msg: 'Pengeluaran berhasil disimpan!', type: 'success' })
      setItem('')
      setAmount('')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-dashed border-gray-100">
        <div className="bg-red-50 p-2.5 rounded-xl text-red-600 shadow-sm">
           <Wallet size={20} />
        </div>
        <div>
           <h2 className="font-bold text-gray-800 text-lg leading-tight">Input Pengeluaran</h2>
           <p className="text-xs text-gray-400 mt-0.5">Catat biaya operasional & belanja</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Input Tanggal */}
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Tanggal</label>
            <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
        </div>

        {/* Input Keperluan */}
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Keperluan</label>
            <input 
                type="text" 
                placeholder="Contoh: Terigu, Gas, Plastik..."
                value={item}
                onChange={(e) => setItem(e.target.value)}
                required
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
        </div>

        {/* Input Biaya */}
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Biaya (Rp)</label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-100 text-gray-500 text-xs font-bold px-1.5 py-0.5 rounded group-focus-within:bg-red-100 group-focus-within:text-red-600 transition-colors">Rp</div>
                <input 
                    type="number" 
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-800 font-bold text-lg placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
            </div>
        </div>

        {/* Tombol Simpan */}
        <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
            {loading ? <Loader2 className="animate-spin" /> : <Plus size={20} strokeWidth={3} />}
            <span>Simpan Data</span>
        </button>

      </form>
    </div>
  )
}