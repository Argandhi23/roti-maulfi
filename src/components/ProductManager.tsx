"use client"

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Trash2, Tag, Save, X, Edit, Loader2 } from 'lucide-react'

export default function ProductManager() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // STATE INPUT
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")

    // STATE EDIT
    const [editingId, setEditingId] = useState<number | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').order('name', { ascending: true })
        if (data) setProducts(data)
    }

    // KLIK TOMBOL EDIT (PENSIL)
    const handleEditClick = (product: any) => {
        setEditingId(product.id)
        setName(product.name)
        setPrice(product.default_price.toString())
        // Scroll ke atas agar user lihat form
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // KLIK TOMBOL BATAL
    const handleCancel = () => {
        setEditingId(null)
        setName("")
        setPrice("")
    }

    // SIMPAN (BISA TAMBAH BARU / UPDATE)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !price) return

        setLoading(true)

        if (editingId) {
            // --- MODE UPDATE ---
            const { error } = await supabase
                .from('products')
                .update({ name: name, default_price: parseInt(price) })
                .eq('id', editingId)

            if (!error) {
                handleCancel() // Reset form
                fetchProducts()
            } else {
                alert("Gagal update menu")
            }
        } else {
            // --- MODE TAMBAH BARU ---
            const { error } = await supabase
                .from('products')
                .insert([{ name: name, default_price: parseInt(price) }])

            if (!error) {
                setName("")
                setPrice("")
                fetchProducts()
            } else {
                // Tampilkan pesan error asli dari Supabase agar ketahuan salahnya apa
                console.error("Error nambah produk:", error)
                alert(`Gagal menambah produk: ${error?.message || "Unknown error"}`)
            }
        }
        setLoading(false)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin hapus menu ini?")) return
        await supabase.from('products').delete().eq('id', id)
        fetchProducts()
    }

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Tag className="text-purple-600" /> {editingId ? "Edit Menu" : "Atur Menu Roti"}
            </h2>

            {/* FORMULIR (BISA INPUT / EDIT) */}
            <form onSubmit={handleSubmit} className={`flex flex-col md:flex-row gap-3 mb-6 p-4 rounded-2xl border transition-colors ${editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-purple-50 border-purple-100'}`}>
                <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Nama Roti</label>
                    <input
                        type="text"
                        placeholder="Contoh: Roti Abon"
                        className="w-full p-3 rounded-xl border border-gray-200 focus:outline-purple-500"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>

                <div className="w-full md:w-40">
                    <label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Harga</label>
                    <input
                        type="number"
                        placeholder="0"
                        className="w-full p-3 rounded-xl border border-gray-200 focus:outline-purple-500"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 items-end">
                    {/* Tombol Simpan / Update */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`h-[50px] px-6 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-sm
                        ${editingId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-purple-600 hover:bg-purple-700'}
                    `}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : editingId ? <Save size={18} /> : <Plus size={18} />}
                        {editingId ? "Update" : "Tambah"}
                    </button>

                    {/* Tombol Batal (Muncul cuma pas Edit) */}
                    {editingId && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="h-[50px] px-4 rounded-xl font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-100"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </form>

            {/* LIST DAFTAR MENU */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {products.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-400 font-medium">Menu kosong.</p>
                        <p className="text-xs text-gray-400">Silakan input nama roti & harga di atas.</p>
                    </div>
                )}

                {products.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all group">
                        <div>
                            <p className="font-bold text-gray-800">{p.name}</p>
                            <p className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1">
                                Rp {p.default_price.toLocaleString('id-ID')}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {/* TOMBOL EDIT */}
                            <button
                                onClick={() => handleEditClick(p)}
                                className="p-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors border border-yellow-100"
                                title="Edit Menu"
                            >
                                <Edit size={16} />
                            </button>

                            {/* TOMBOL HAPUS */}
                            <button
                                onClick={() => handleDelete(p.id)}
                                className="p-2 text-red-400 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                                title="Hapus Menu"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}