"use client"

import { useState, useEffect } from "react";
import { createBrowserClient } from '@supabase/ssr'
import { UtensilsCrossed, UserCircle } from 'lucide-react'; 

// COMPONENTS
import DailyInput from "@/components/DailyInput";
import SalesList from "@/components/SalesList"; 
import ExpenseInput from "@/components/ExpenseInput"; 
import ExpenseList from "@/components/ExpenseList";   
import DashboardSummary from "@/components/DashboardSummary"; 
import MobileNav from "@/components/MobileNav"; 
import LogoutButton from "@/components/LogoutButton"; 
import DownloadReport from "@/components/DownloadReport";
import ChangePassword from "@/components/ChangePassword";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // STATE: Edit Mode & Refresh Trigger
  const [editingItem, setEditingItem] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Trigger saat data berhasil disimpan/diedit
  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1); // Update semua list & chart
    setEditingItem(null); 
    
    // Opsional: Jika di mobile dan habis edit, kembalikan ke tab report?
    // Saat ini kita biarkan di input agar bisa lanjut input lagi (high volume input).
    if (window.innerWidth < 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setActiveTab("input"); // Paksa pindah ke tab input
    // Timeout kecil untuk memastikan tab render dulu baru scroll
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    // Opsional: Kembali ke tab sebelumnya jika perlu
  };

  useEffect(() => {
    const getUser = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
            setUserEmail(user.email)
        }
    }
    getUser()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 pb-28 md:pb-10 font-sans selection:bg-blue-100">
      
      {/* --- HEADER (SHARED) --- */}
      <div className="bg-blue-700 text-white pt-8 pb-24 px-6 md:px-10 rounded-b-[3rem] shadow-xl relative overflow-hidden">
         {/* Dekorasi Background */}
         <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
         <div className="absolute top-[40px] left-[-40px] w-32 h-32 bg-blue-400 opacity-10 rounded-full blur-xl"></div>

         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
            <div>
                {/* User Info Badge */}
                <div className="inline-flex items-center gap-2 mb-3 bg-blue-800/40 px-3 py-1.5 rounded-full border border-blue-500/30 backdrop-blur-sm">
                    <UserCircle size={14} className="text-blue-200"/>
                    {userEmail ? (
                        <span className="font-medium text-blue-100 text-xs tracking-wide">{userEmail}</span>
                    ) : (
                        <div className="w-24 h-4 bg-blue-400/30 rounded animate-pulse"></div>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl shadow-lg">
                        <UtensilsCrossed className="w-6 h-6 text-blue-700" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Roti Maul</h1>
                </div>
            </div>

            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                <LogoutButton />
                <div className="hidden md:block mt-2 w-full md:w-auto">
                    <DownloadReport />
                </div>
            </div>
         </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-16 relative z-20">
        
        {/* === TAMPILAN MOBILE (TAB BASED) === */}
        <div className="md:hidden">
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <DashboardSummary refreshTrigger={refreshTrigger} />
                    
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Laporan & Arsip</h3>
                        <DownloadReport />
                    </div>
                     <div className="mb-20"><ChangePassword /></div>
                </div>
            )}
            
            {activeTab === 'input' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Header Input State */}
                    <div className={`text-white p-4 rounded-2xl shadow-lg transition-colors duration-300
                        ${editingItem ? 'bg-yellow-500 shadow-yellow-200' : 'bg-blue-600 shadow-blue-200'}`}>
                        <h2 className="font-bold text-lg">
                            {editingItem ? "Edit Data Produksi" : "Input Produksi"}
                        </h2>
                        <p className="text-white/80 text-sm">
                            {editingItem ? "Perbaiki data yang salah" : "Catat hasil produksi & penjualan hari ini"}
                        </p>
                    </div>

                    <DailyInput 
                        onSuccess={handleSuccess} 
                        itemToEdit={editingItem} 
                        onCancel={handleCancelEdit} 
                    />
                </div>
            )}
            
            {activeTab === 'expense' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                      <div className="bg-red-600 text-white p-4 rounded-2xl shadow-lg shadow-red-200">
                        <h2 className="font-bold text-lg">Keuangan Keluar</h2>
                        <p className="text-red-100 text-sm">Catat belanja bahan & operasional</p>
                    </div>
                    <ExpenseInput onSuccess={handleSuccess} /> 
                    <ExpenseList refreshTrigger={refreshTrigger} />
                </div>
            )}
            
            {activeTab === 'report' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-2">
                        <h2 className="font-bold text-gray-800 text-lg">Riwayat Transaksi</h2>
                    </div>
                    {/* PENTING: Pass onEdit di sini agar mobile bisa edit */}
                    <SalesList refreshTrigger={refreshTrigger} onEdit={handleEditClick} />
                </div>
            )}
        </div>

        {/* === TAMPILAN DESKTOP (GRID LAYOUT) === */}
        <div className="hidden md:block space-y-10">
            <DashboardSummary refreshTrigger={refreshTrigger} />
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {/* KOLOM KIRI: PENJUALAN */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                        <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-sm text-sm">1</span>
                        <h2 className="text-xl font-bold text-gray-800">Manajemen Penjualan</h2>
                    </div>
                    
                    {/* Form Input (Bisa Mode Edit) */}
                    <DailyInput 
                        onSuccess={handleSuccess} 
                        itemToEdit={editingItem} 
                        onCancel={handleCancelEdit} 
                    />
                    
                    {/* List Penjualan (Tabel) */}
                    <SalesList refreshTrigger={refreshTrigger} onEdit={handleEditClick} />
                </div>

                {/* KOLOM KANAN: PENGELUARAN */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                         <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold shadow-sm text-sm">2</span>
                        <h2 className="text-xl font-bold text-gray-800">Manajemen Pengeluaran</h2>
                    </div>
                    <ExpenseInput onSuccess={handleSuccess} />
                    <ExpenseList refreshTrigger={refreshTrigger} />
                </div>
            </div>

            {/* Footer Area Desktop */}
            <div className="mt-20 pt-10 border-t border-gray-200">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-gray-400 text-sm font-medium uppercase tracking-widest">Pengaturan Akun</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                 </div>
                 <div className="max-w-2xl mx-auto">
                    <ChangePassword />
                 </div>
            </div>
            
            <div className="text-center text-gray-300 text-xs py-10">
                &copy; {new Date().getFullYear()} Roti Maul System.
            </div>
        </div>

      </div>

      {/* MOBILE NAV (Hanya muncul di mobile) */}
      <div className="md:hidden">
          <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </main>
  );
}