"use client"

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Plus, X, Save, Tag, AlertCircle } from 'lucide-react'

interface DailyInputProps {
  onSuccess?: () => void;
  itemToEdit?: any; 
  onCancel?: () => void; 
}

export default function DailyInput({ onSuccess, itemToEdit, onCancel }: DailyInputProps) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  
  // FORM STATES
  const [itemName, setItemName] = useState("") 
  const [price, setPrice] = useState(0)
  const [production, setProduction] = useState("")
  const [returnCount, setReturnCount] = useState("0")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // STATE MODAL TAMBAH PRODUK
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProdName, setNewProdName] = useState("")
  const [newProdPrice, setNewProdPrice] = useState("")
  const [addingProduct, setAddingProduct] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Ambil Master Data
  const fetchMasterProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('name', { ascending: true })
      if (data) setProducts(data)
  }

  useEffect(() => {
    fetchMasterProducts()
  }, [])

  // 2. Jika Mode Edit
  useEffect(() => {
    if (itemToEdit) {
      setItemName(itemToEdit.item_name)
      setPrice(itemToEdit.price)
      setProduction(itemToEdit.production?.toString() || "")
      setReturnCount(itemToEdit.return_count?.toString() || "0")
      if (itemToEdit.date) setDate(itemToEdit.date)
    }
  }, [itemToEdit])

  // 3. Logic Pilih Produk
  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value
    setItemName(selectedName)
    
    const product = products.find(p => p.name === selectedName)
    
    // Pastikan mapping ke 'default_price' sesuai database
    if (product && product.default_price) {
        setPrice(product.default_price)
    } else {
        setPrice(0) 
    }
  }

  // 4. Logic Quick Add (Tambah Master Menu Baru)
  const handleQuickAddProduct = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newProdName || !newProdPrice) return
      
      setAddingProduct(true)
      
      // FIX: Pastikan insert ke kolom 'default_price'
      const { data, error } = await supabase
        .from('products')
        .insert([{ name: newProdName, default_price: parseInt(newProdPrice) }])
        .select() 

      if (error) {
          console.error("Error Detail:", error)
          alert(`Gagal menambah produk: ${error.message}`) 
      } else if (data && data.length > 0) {
          const newProduct = data[0]
          await fetchMasterProducts()
          
          setItemName(newProduct.name)
          setPrice(newProduct.default_price)
          
          setNewProdName("")
          setNewProdPrice("")
          setShowAddModal(false)
      }
      setAddingProduct(false)
  }

  // 5. Submit Form Utama
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const qtySold = parseInt(production || "0") - parseInt(returnCount || "0")

    // Validasi Sisa
    if (qtySold < 0) {
        alert("Jumlah return tidak boleh lebih besar dari produksi!")
        setLoading(false)
        return
    }

    // Validasi Harga (Penting untuk Revenue)
    if (price <= 0) {
        const confirm0 = confirm("Harga produk ini 0. Apakah Anda yakin lanjut menyimpan dengan total pendapatan Rp 0?");
        if (!confirm0) {
            setLoading(false);
            return;
        }
    }

    // FIX: LOGIC REVENUE (Uang Masuk = Terjual x Harga)
    const totalRevenue = qtySold * price

    const payload = {
        date,
        item_name: itemName,
        price: price, 
        production: parseInt(production || "0"),
        return_count: parseInt(returnCount || "0"),
        amount: totalRevenue // <-- Ini yang diperbaiki
    }

    let error;

    if (itemToEdit) {
        const { error: updateError } = await supabase.from('daily_sales').update(payload).eq('id', itemToEdit.id)
        error = updateError
    } else {
        const { error: insertError } = await supabase.from('daily_sales').insert([payload])
        error = insertError
    }

    if (error) {
        console.error("Error Save:", error)
        alert(`Gagal menyimpan: ${error.message}`)
    } else {
        if (!itemToEdit) {
            setProduction("")
            setReturnCount("0")
            // Kita biarkan tanggal dan nama item tetap terisi agar user bisa input cepat untuk item berikutnya
        }
        if (onSuccess) onSuccess() 
    }
    setLoading(false)
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  // Hitung terjual untuk display
  const currentSold = parseInt(production || "0") - parseInt(returnCount || "0")

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative">
      
      {/* MODAL TAMBAH PRODUK BARU */}
      {showAddModal && (
        <div className="absolute inset-0 bg-white/95 z-50 rounded-3xl flex flex-col justify-center items-center p-6 animate-in fade-in zoom-in duration-200">
            <div className="w-full max-w-xs bg-white shadow-xl border border-gray-200 p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Tambah Master Menu</h3>
                    <button type="button" onClick={() => setShowAddModal(false)}><X size={20} className="text-gray-400"/></button>
                </div>
                <form onSubmit={handleQuickAddProduct} className="space-y-3">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500">Nama Roti</label>
                        <input autoFocus type="text" placeholder="Contoh: Roti Keju" className="w-full p-2 border rounded-lg focus:ring-2 ring-blue-500 outline-none" value={newProdName} onChange={e => setNewProdName(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500">Harga Jual</label>
                        <input type="number" placeholder="0" className="w-full p-2 border rounded-lg focus:ring-2 ring-blue-500 outline-none" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} />
                    </div>
                    <button type="submit" disabled={addingProduct} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-colors">
                        {addingProduct ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Simpan
                    </button>
                </form>
            </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* TANGGAL */}
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal</label>
            <input 
              type="date" 
              required
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold text-gray-700 focus:ring-2 ring-blue-100 transition-all"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
        </div>

        {/* NAMA PRODUK */}
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Produk</label>
            <div className="flex gap-2 items-center">
                <div className="w-full">
                    <select 
                        required
                        value={itemName}
                        onChange={handleProductSelect}
                        className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-800 font-medium"
                    >
                        <option value="" disabled>-- Pilih Roti --</option>
                        {products.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                    </select>
                </div>
                
                <button 
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-100 border border-blue-100 h-[50px] w-[50px] flex items-center justify-center flex-shrink-0 transition-colors"
                    title="Tambah Menu Baru"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* INFO HARGA */}
            {itemName && (
                <div className={`mt-3 flex items-center gap-2 text-sm p-3 rounded-xl border transition-colors
                    ${price > 0 ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-orange-50 border-orange-100 text-orange-800'}
                `}>
                    {price > 0 ? <Tag size={16} className="text-blue-500"/> : <AlertCircle size={16} className="text-orange-500"/>}
                    
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold opacity-70">Harga Satuan</span>
                        <span className="font-bold text-lg">
                            {price > 0 ? formatRupiah(price) : "Rp 0 (Belum diset)"}
                        </span>
                    </div>
                </div>
            )}
        </div>

        {/* PRODUKSI & SISA */}
        <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Produksi</label>
                <input 
                type="number" 
                required
                placeholder="0"
                className="w-full p-3 bg-blue-50/50 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-900 text-lg transition-all"
                value={production}
                onChange={(e) => setProduction(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sisa / Return</label>
                <input 
                type="number" 
                required
                placeholder="0"
                className="w-full p-3 bg-red-50/50 rounded-xl border border-red-200 outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-900 text-lg transition-all"
                value={returnCount}
                onChange={(e) => setReturnCount(e.target.value)}
                />
            </div>
        </div>

        {/* INFO TERJUAL & REVENUE PREVIEW */}
        <div className="flex justify-between items-center text-xs text-gray-500 px-1 border-t pt-3 mt-2">
             <div className="flex gap-4">
                 <span>Terjual: <b className="text-green-600">{currentSold < 0 ? 0 : currentSold} pcs</b></span>
             </div>
             <div>
                 <span>Est. Pendapatan: <b className="text-green-600">{formatRupiah(currentSold * price)}</b></span>
             </div>
        </div>

        {/* TOMBOL SIMPAN */}
        <div className="flex gap-2 pt-2">
            {itemToEdit && (
                <button 
                    type="button" onClick={onCancel}
                    className="flex-1 bg-gray-100 text-gray-600 p-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                    Batal
                </button>
            )}
            
            <button 
                type="submit" 
                disabled={loading || !itemName}
                className={`flex-1 text-white p-3 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2
                    ${itemToEdit ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}
                    ${(loading || !itemName) ? 'opacity-70 cursor-not-allowed' : ''}
                `}
            >
                {loading ? <Loader2 className="animate-spin" /> : (itemToEdit ? "Update" : "Simpan")}
            </button>
        </div>

      </form>
    </div>
  )
}