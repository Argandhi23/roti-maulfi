"use client"

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { TrendingUp, TrendingDown, Wallet, Package, Trophy, Calendar, AlertTriangle, ArrowDownRight } from 'lucide-react';

interface Props {
  refreshTrigger?: number;
}

export default function DashboardSummary({ refreshTrigger }: Props) {
  const [stats, setStats] = useState({
    omzet: 0,
    pengeluaran: 0,
    kerugianSisa: 0, // State baru untuk menyimpan total nilai rugi
    profit: 0,
    totalProduksi: 0,
    totalTerjual: 0,
    totalSisa: 0
  });

  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchStats = useCallback(async () => {
    const [year, month] = selectedMonth.split('-');
    const startDate = `${selectedMonth}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${selectedMonth}-${lastDay}`;

    // 1. Ambil Data Penjualan
    const { data: sales, error: salesError } = await supabase
      .from('daily_sales')
      .select('item_name, price, production, return_count') // Kita abaikan column amount yg salah
      .gte('date', startDate)
      .lte('date', endDate);

    // 2. Ambil Data Pengeluaran
    const { data: expenses, error: expenseError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', startDate)
      .lte('date', endDate);

    if (salesError || expenseError) {
        console.error("Error fetching stats:", salesError || expenseError);
        return;
    }

    // 3. LOGIKA BARU (SISA = RUGI)
    let totalOmzet = 0;
    let totalKerugian = 0; // Nilai rupiah barang sisa
    let totalProduksi = 0;
    let totalSisa = 0;
    let totalTerjual = 0;
    
    const productMap = new Map();

    if (sales) {
        sales.forEach(item => {
            const price = Number(item.price) || 0;
            const production = Number(item.production) || 0;
            const returns = Number(item.return_count) || 0;
            
            // Hitung Fisik
            const realSold = Math.max(0, production - returns); 
            
            // Hitung Duit
            const revenue = price * realSold;      // Uang Masuk
            const lossValue = price * returns;     // Uang Hilang (Rugi Sisa)

            // Akumulasi Global
            totalOmzet += revenue;
            totalKerugian += lossValue; // Tambahkan ke total kerugian
            
            totalProduksi += production;
            totalSisa += returns;
            totalTerjual += realSold;

            // Grouping Produk
            const currentName = item.item_name || "Tanpa Nama";
            const existing = productMap.get(currentName) || { sold: 0, revenue: 0 };
            productMap.set(currentName, {
                sold: existing.sold + realSold,
                revenue: existing.revenue + revenue
            });
        });
    }

    const sortedProducts = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

    const totalPengeluaran = expenses?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

    // RUMUS PROFIT BARU:
    // Profit = Omzet - Pengeluaran - Kerugian Barang Sisa
    const netProfit = totalOmzet - totalPengeluaran - totalKerugian;

    setStats({
      omzet: totalOmzet,
      pengeluaran: totalPengeluaran,
      kerugianSisa: totalKerugian,
      profit: netProfit,
      totalProduksi,
      totalTerjual,
      totalSisa
    });

    setTopProducts(sortedProducts);
  }, [selectedMonth, supabase]);

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_sales' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchStats)
      .subscribe();
    return () => { supabase.removeChannel(channel) };
  }, [fetchStats, refreshTrigger, supabase]);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      
      {/* HEADER (Sama seperti sebelumnya) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <div className="flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Laporan Keuangan</h2>
            </div>
            <p className="text-gray-400 text-sm mt-1">Sisa barang dihitung sebagai kerugian.</p>
        </div>
        <div className="flex items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <Calendar size={16} className="text-gray-500 mr-2"/>
            <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
            />
        </div>
      </div>

      {/* --- KARTU KEUANGAN UTAMA --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* 1. OMZET KOTOR */}
        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 relative overflow-hidden">
            <p className="text-blue-600 font-bold text-xs mb-1 uppercase tracking-wider">Pemasukan (Omzet)</p>
            <h3 className="text-2xl font-bold text-blue-800">{formatRupiah(stats.omzet)}</h3>
            <Wallet className="absolute right-3 top-3 text-blue-200" size={24}/>
        </div>

        {/* 2. PENGELUARAN */}
        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 relative overflow-hidden">
            <p className="text-gray-500 font-bold text-xs mb-1 uppercase tracking-wider">Pengeluaran</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatRupiah(stats.pengeluaran)}</h3>
            <ArrowDownRight className="absolute right-3 top-3 text-gray-300" size={24}/>
        </div>

        {/* 3. KERUGIAN SISA (BARU!) */}
        <div className="p-5 rounded-2xl bg-red-50 border border-red-100 relative overflow-hidden">
            <div className="flex items-center gap-1 mb-1">
                <p className="text-red-600 font-bold text-xs uppercase tracking-wider">Rugi (Barang Sisa)</p>
                <AlertTriangle size={12} className="text-red-500"/>
            </div>
            <h3 className="text-2xl font-bold text-red-700">{formatRupiah(stats.kerugianSisa)}</h3>
            <p className="text-[10px] text-red-400 mt-1">Mengurangi profit</p>
        </div>

        {/* 4. NET PROFIT */}
        <div className={`p-5 rounded-2xl text-white relative overflow-hidden shadow-lg ${stats.profit >= 0 ? 'bg-gradient-to-br from-green-500 to-green-700 shadow-green-200' : 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-200'}`}>
            <p className="font-medium text-xs mb-1 uppercase tracking-wider opacity-80">
                Bersih (Net Profit)
            </p>
            <h3 className="text-2xl font-bold tracking-tight">
                {formatRupiah(stats.profit)}
            </h3>
            <Trophy className="absolute right-[-5px] bottom-[-5px] text-white opacity-20" size={60}/>
        </div>
      </div>

      {/* --- BAGIAN DETAIL PRODUK & STOK (Code sama seperti sebelumnya, aman) --- */}
      {/* ... copy paste bagian Top 5 Produk dan Flow Stok dari kode sebelumnya di sini ... */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
        
        {/* KOLOM KIRI: Top 5 Produk */}
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="text-yellow-500" size={18} />
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Top 5 Terlaris</h3>
            </div>
            
            {topProducts.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-sm text-gray-400 italic">Belum ada data penjualan.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {topProducts.map((prod, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-white text-gray-500'}`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{prod.name}</p>
                                    <p className="text-[10px] text-gray-500">{prod.sold} pcs terjual</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-blue-600 text-sm">{formatRupiah(prod.revenue)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* KOLOM KANAN: Ringkasan Stok */}
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Package className="text-blue-500" size={18} />
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Flow Stok Barang</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Total Produksi</p>
                    <p className="font-bold text-gray-800 text-xl">{stats.totalProduksi}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <p className="text-xs text-green-600 mb-1">Total Terjual</p>
                    <p className="font-bold text-green-700 text-xl">{stats.totalTerjual}</p>
                </div>
                <div className="col-span-2 bg-red-50 p-4 rounded-xl border border-red-200 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-red-500 mb-1">Barang Sisa / Retur</p>
                        <p className="font-bold text-red-700 text-xl">{stats.totalSisa} pcs</p>
                        <p className="text-[10px] text-red-400 mt-1 italic">Senilai {formatRupiah(stats.kerugianSisa)}</p>
                    </div>
                    <AlertTriangle className="text-red-200" size={40} />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}