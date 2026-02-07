"use client"

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Trash2, ShoppingBag, RefreshCw, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

type Expense = {
  id: number
  created_at: string
  item_name: string
  amount: number
  date: string
}

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination State
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 7 // Tampilkan 7 item per halaman

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    
    // Hitung range untuk pagination database
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    const { data, error, count } = await supabase
      .from('expenses')
      .select('*', { count: 'exact' }) // Minta total jumlah data
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to) // Ambil hanya sebagian

    if (data) {
      setExpenses(data)
      if (count !== null) setTotalPages(Math.ceil(count / itemsPerPage))
    }
    setLoading(false)
  }, [page, supabase]) // Re-fetch jika page berubah

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data belanja ini?")) return;

    const { error } = await supabase.from('expenses').delete().eq('id', id)

    if (!error) {
      fetchExpenses() // Refresh list tanpa reload page
    } else {
      alert("Gagal menghapus data.")
    }
  }

  useEffect(() => {
    fetchExpenses()
    
    const channel = supabase
      .channel('realtime-expenses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchExpenses)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchExpenses, supabase])

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          <ShoppingBag size={18} className="text-red-500"/>
          Riwayat Belanja
        </h3>
        <button 
            onClick={fetchExpenses} 
            className={`p-2 rounded-full text-gray-400 hover:text-red-500 transition-all ${loading ? "animate-spin" : ""}`}
        >
            <RefreshCw size={16} />
        </button>
      </div>

      {/* LIST */}
      <div className="flex-1 p-2"> 
        {loading ? (
           <div className="py-10 text-center text-gray-400 flex flex-col items-center gap-2">
             <RefreshCw className="animate-spin" size={20}/>
             <span className="text-sm">Memuat...</span>
           </div>
        ) : expenses.length === 0 ? (
           <div className="py-10 text-center text-gray-400 italic text-sm">Belum ada data.</div>
        ) : (
          <div className="space-y-2">
            {expenses.map((item) => (
              <div key={item.id} className="p-3 hover:bg-red-50 rounded-xl transition-colors flex justify-between items-center border border-transparent hover:border-red-100 group">
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                        <Calendar size={10} />
                        {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="font-bold text-gray-700 text-sm capitalize">{item.item_name}</div>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs">
                        Rp {item.amount.toLocaleString('id-ID')}
                    </span>
                    <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                    </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-gray-100 flex justify-between items-center text-xs">
            <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"
            >
                <ChevronLeft size={16}/>
            </button>
            <span className="text-gray-500">Hal {page}/{totalPages}</span>
            <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"
            >
                <ChevronRight size={16}/>
            </button>
        </div>
      )}
    </div>
  )
}