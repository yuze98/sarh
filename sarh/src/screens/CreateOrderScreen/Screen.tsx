import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { OrderForm } from './components/OrderForm'

export default function CreateOrderScreen() {
  const navigate = useNavigate()
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-[#f4f6f3] text-[#1b2624]">
      <header className="border-b border-[#dce4dd] bg-white"><div className="mx-auto max-w-4xl px-5 py-4 sm:px-8"><Link to="/orders" className="text-xs font-medium text-[#63806f] hover:text-[#19594b]">← Orders</Link><p className="mt-2 text-lg font-semibold">Create order</p></div></header>
      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        {createdOrderId && <div className="mb-5 border-l-2 border-[#32805a] bg-[#edf6ef] px-4 py-3 text-sm text-[#265b3d]" role="status">Order {createdOrderId.slice(0, 8)} created successfully.</div>}
        <div className="rounded-md border border-[#e1e7e1] bg-white p-5 sm:p-7"><OrderForm onCreated={(id) => { setCreatedOrderId(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }} /></div>
        <div className="mt-5 flex justify-end"><button className="text-xs text-[#77847c] hover:text-[#19594b]" onClick={() => navigate('/orders')}>Cancel</button></div>
      </section>
    </main>
  )
}