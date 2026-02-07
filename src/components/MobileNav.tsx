"use client"
import { Home, PlusCircle, ShoppingBag, Wallet } from 'lucide-react'

// Komponen ini akan melayang di bawah layar HP
export default function MobileNav({ activeTab, setActiveTab }: any) {
  const menus = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'input', label: 'Input', icon: PlusCircle },
    { id: 'expense', label: 'Belanja', icon: Wallet },
    { id: 'report', label: 'Laporan', icon: ShoppingBag },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => setActiveTab(menu.id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              activeTab === menu.id ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <menu.icon size={24} strokeWidth={activeTab === menu.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{menu.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}