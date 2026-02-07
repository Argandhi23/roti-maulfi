"use client"

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import * as XLSX from 'xlsx'
import { FileSpreadsheet, Loader2, CalendarDays } from 'lucide-react'

export default function DownloadReport() {
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleDownload = async () => {
    if (!selectedMonth) {
      alert("Pilih bulan terlebih dahulu!")
      return
    }

    setLoading(true)
    try {
      const [year, month] = selectedMonth.split('-')
      const startDate = `${selectedMonth}-01`
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      const endDate = `${selectedMonth}-${lastDay}`

      const { data: sales, error: salesError } = await supabase
        .from('daily_sales')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (salesError || expenseError) throw new Error("Gagal ambil data")

      // ==========================================
      // SHEET 1: PENJUALAN + HITUNG RUGI
      // ==========================================
      const salesData = sales?.map(item => {
        const prod = Number(item.production) || 0;
        const returns = Number(item.return_count) || 0;
        const price = Number(item.price) || 0;
        
        const realSold = Math.max(0, prod - returns);
        const realRevenue = realSold * price;
        
        // HITUNG NILAI RUGI (Sisa * Harga)
        const lossValue = returns * price;

        return {
          'Tanggal': item.date,
          'Nama Roti': item.item_name,
          'Harga': price,
          'Produksi': prod,
          'Terjual': realSold,
          'Sisa': returns,
          'Omzet (Masuk)': realRevenue,
          'Nilai Rugi (Sisa)': lossValue // Kolom Baru
        }
      }) || []

      // Hitung Total2an
      const totalOmzet = salesData.reduce((acc, curr) => acc + (curr['Omzet (Masuk)'] || 0), 0)
      const totalRugiSisa = salesData.reduce((acc, curr) => acc + (curr['Nilai Rugi (Sisa)'] || 0), 0)

      salesData.push(
        // @ts-ignore
        {},
        // @ts-ignore
        { 
          'Tanggal': 'TOTAL PERIODE INI', 
          'Nama Roti': '', 
          'Harga': '', 
          'Produksi': '', 
          'Terjual': '', 
          'Sisa': '', 
          'Omzet (Masuk)': totalOmzet,
          'Nilai Rugi (Sisa)': totalRugiSisa 
        }
      )

      // ==========================================
      // SHEET 2: PENGELUARAN
      // ==========================================
      const expenseData = expenses?.map(item => ({
        'Tanggal': item.date,
        'Keperluan': item.item_name,
        'Biaya': Number(item.amount) || 0
      })) || []

      const totalExpense = expenseData.reduce((acc, curr) => acc + (curr['Biaya'] || 0), 0)

      expenseData.push(
        // @ts-ignore
        {}, 
        // @ts-ignore
        { 'Tanggal': 'TOTAL', 'Keperluan': '', 'Biaya': totalExpense }
      )

      // ==========================================
      // SHEET 3: LAPORAN LABA RUGI (BARU)
      // ==========================================
      const netProfit = totalOmzet - totalExpense - totalRugiSisa; // RUMUS BARU

      const summaryData = [
        { 'Keterangan': 'Total Penjualan (Omzet Kotor)', 'Jumlah': totalOmzet },
        { 'Keterangan': 'Total Pengeluaran Operasional', 'Jumlah': totalExpense },
        { 'Keterangan': 'Total Kerugian Barang Sisa', 'Jumlah': totalRugiSisa }, // Ditampilkan
        { 'Keterangan': '-------------------------', 'Jumlah': '-------' },
        { 'Keterangan': 'KEUNTUNGAN BERSIH (NET PROFIT)', 'Jumlah': netProfit }
      ];

      // ==========================================
      // GENERATE EXCEL
      // ==========================================
      const wb = XLSX.utils.book_new()

      const wsSales = XLSX.utils.json_to_sheet(salesData)
      wsSales['!cols'] = [{wch:12}, {wch:25}, {wch:10}, {wch:8}, {wch:8}, {wch:6}, {wch:15}, {wch:15}]
      XLSX.utils.book_append_sheet(wb, wsSales, "Data Penjualan")

      const wsExp = XLSX.utils.json_to_sheet(expenseData)
      wsExp['!cols'] = [{wch:15}, {wch:30}, {wch:15}]
      XLSX.utils.book_append_sheet(wb, wsExp, "Data Pengeluaran")

      const wsSum = XLSX.utils.json_to_sheet(summaryData)
      wsSum['!cols'] = [{wch:35}, {wch:20}]
      XLSX.utils.book_append_sheet(wb, wsSum, "Ringkasan Laba Rugi")

      XLSX.writeFile(wb, `Laporan_Keuangan_${selectedMonth}.xlsx`)

    } catch (error) {
      console.error("Error:", error)
      alert("Gagal mendownload.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-full shadow-sm">
        <CalendarDays size={18} className="text-gray-500" />
        <input 
          type="month" 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 w-full outline-none cursor-pointer"
        />
      </div>

      <button 
        onClick={handleDownload}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all active:scale-95 w-full text-sm"
      >
        {loading ? <Loader2 className="animate-spin" size={20}/> : <FileSpreadsheet size={20}/>}
        <span>Download Laporan</span>
      </button>
      
      <p className="text-[10px] text-gray-400 text-center mt-1">
        *Roti sisa akan dihitung sebagai pengurang profit.
      </p>
    </div>
  )
}