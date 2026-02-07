"use client"

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Trash2, Edit, Search, Calendar, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

interface Props {
  refreshTrigger: number;
  onEdit: (item: any) => void; 
}

export default function SalesList({ refreshTrigger, onEdit }: Props) {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Pagination State
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 8

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch Data dengan Server-Side Pagination & Search
  const fetchSales = useCallback(async () => {
    setLoading(true)
    
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    // Mulai query
    let query = supabase
      .from('daily_sales')
      .select('*', { count: 'exact' }) // Hitung total data
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    // Jika ada pencarian, tambahkan filter ilike (case insensitive)
    if (searchTerm) {
        query = query.ilike('item_name', `%${searchTerm}%`)
    }

    const { data, error, count } = await query

    if (error) {
        console.error('Error fetching sales:', error)
    } else {
        setSales(data || [])
        if (count !== null) {
            setTotalItems(count)
            setTotalPages(Math.ceil(count / itemsPerPage))
        }
    }
    setLoading(false)
  }, [page, searchTerm, supabase]) // Jalankan ulang kalau page/search berubah

  // Trigger fetch saat refreshTrigger berubah (dari parent)
  useEffect(() => {
    fetchSales()
  }, [refreshTrigger, fetchSales])

  const handleDelete = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return

    const { error } = await supabase.from('daily_sales').delete().eq('id', id)

    if (error) {
      alert("Gagal menghapus!")
    } else {
      fetchSales() // Cukup panggil fungsi ini, JANGAN reload window
    }
  }

  // Handle Search Input (Reset page ke 1 saat ngetik)
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value)
      setPage(1) 
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  const formatDate = (dateString: string) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Riwayat Produksi
            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">{totalItems} Data</span>
        </h2>

        <div className="relative w-full md:w-64">
            <input 
                type="text" 
                placeholder="Cari roti..." 
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-bold">
              <th className="p-4 border-b">Tanggal</th>
              <th className="p-4 border-b">Produk</th>
              <th className="p-4 text-center border-b">Prod</th>
              <th className="p-4 text-center border-b">Laku</th>
              <th className="p-4 text-center border-b">Sisa</th>
              <th className="p-4 text-right border-b">Omzet</th>
              <th className="p-4 text-center border-b">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
                <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="animate-spin" size={16}/> Memuat data...
                        </div>
                    </td>
                </tr>
            ) : sales.length === 0 ? (
                <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400 italic">Data tidak ditemukan.</td>
                </tr>
            ) : (
                sales.map((item) => {
                    const realSold = Math.max(0, item.production - item.return_count);
                    const realOmzet = realSold * item.price;
                    const isRugi = item.return_count > 0;

                    return (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group text-sm">
                        <td className="p-4 text-gray-500 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400"/>
                                {formatDate(item.date)}
                            </div>
                        </td>
                        <td className="p-4 font-bold text-gray-700">
                            {item.item_name}
                            <div className="text-xs text-gray-400 font-normal mt-0.5">
                                @ {formatRupiah(item.price)}
                            </div>
                        </td>
                        <td className="p-4 text-center">
                            <span className="bg-gray-100 text-gray-600 py-1 px-2.5 rounded-lg text-xs font-bold">
                                {item.production}
                            </span>
                        </td>
                        <td className="p-4 text-center">
                            <span className="bg-green-100 text-green-700 py-1 px-2.5 rounded-lg text-xs font-bold">
                                {realSold} 
                            </span>
                        </td>
                        <td className="p-4 text-center">
                            {item.return_count > 0 ? (
                                <span className="bg-red-100 text-red-600 py-1 px-2.5 rounded-lg text-xs font-bold">
                                    {item.return_count}
                                </span>
                            ) : (
                                <span className="text-gray-300">-</span>
                            )}
                        </td>
                        <td className="p-4 text-right font-bold text-blue-600">
                            {formatRupiah(realOmzet)}
                        </td>
                        <td className="p-4 text-center">
                            <div className="flex justify-center gap-2">
                                <button 
                                    onClick={() => onEdit(item)}
                                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Hapus"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                )})
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-400">Hal {page} dari {totalPages}</span>
        <div className="flex gap-2">
            <button 
                onClick={() => setPage(p => Math.max(1, p-1))} 
                disabled={page === 1 || loading}
                className="p-2 border rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <ChevronLeft size={16}/>
            </button>
            <button 
                onClick={() => setPage(p => Math.min(totalPages, p+1))} 
                disabled={page === totalPages || loading}
                className="p-2 border rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <ChevronRight size={16}/>
            </button>
        </div>
      </div>
    </div>
  )
}