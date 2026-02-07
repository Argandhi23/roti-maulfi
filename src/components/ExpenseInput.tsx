"use client"

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Loader2 } from 'lucide-react'

// 1. Definisikan tipe Props biar TypeScript senang
interface Props {
  onSuccess: () => void;
}

// 2. Terima props di sini
export default function ExpenseInput({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [itemName, setItemName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName || !amount) return

    setLoading(true)

    // 1. Insert ke database
    const { error } = await supabase
      .from('expenses')
      .insert([
        { 
          item_name: itemName, 
          amount: Number(amount),
          date: date 
        }
      ])

    if (error) {
      alert('Gagal menyimpan pengeluaran')
      console.error(error)
    } else {
      // 2. Reset Form
      setItemName('')
      setAmount('')
      
      // 3. Panggil fungsi onSuccess agar halaman utama merefresh data!
      onSuccess();
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="bg-red-100 p-2 rounded-lg text-red-600">
                <Plus size={18} />
            </div>
            Catat Pengeluaran
        </h3>
        
        <div className="space-y-3">
            <div>
                <label className="text-xs font-bold text-gray-500 ml-1">Tanggal</label>
                <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-700"
                />
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 ml-1">Nama Barang</label>
                <input 
                    type="text" 
                    placeholder="Cth: Tepung, Gas, Listrik" 
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 ml-1">Total Harga (Rp)</label>
                <input 
                    type="number" 
                    placeholder="0" 
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-lg"
                />
            </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 transition-all flex justify-center items-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" /> : 'Simpan Pengeluaran'}
      </button>
    </form>
  )
}