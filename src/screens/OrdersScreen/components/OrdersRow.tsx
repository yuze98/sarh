import { useState } from 'react'
import { Button } from '../../../components/Button'
import type { Order } from '../../../types/order'
import { formatCurrency } from '../../../utils/formatCurrency'
import { formatDate } from '../../../utils/formatDate'

const statusColors: Record<Order['status'], string> = {
  pending: 'bg-[#fff2d7] text-[#8b5b00]',
  paid: 'bg-[#e1f3e9] text-[#216644]',
  shipped: 'bg-[#e4edf7] text-[#355c80]',
  delivered: 'bg-[#dff1ed] text-[#23675a]',
  cancelled: 'bg-[#f7e5e1] text-[#963f33]',
}

export function OrdersRow({ order, canDelete, onDelete }: { order: Order; canDelete: boolean; onDelete(order: Order): Promise<void> }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(): Promise<void> {
    if (!window.confirm(`Delete order ${order.id.slice(0, 8)}?`)) return
    setDeleting(true)
    try {
      await onDelete(order)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <tr className="border-b border-[#edf0ec] last:border-0 hover:bg-[#f8faf7]">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[#52635c]">{order.id.slice(0, 8)}</td>
      <td className="min-w-56 px-4 py-3"><p className="font-medium text-[#25332e]">{order.customerName}</p><p className="mt-0.5 text-xs text-[#76837b]">{order.customerEmail}</p></td>
      <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-xs font-medium ${statusColors[order.status]}`}>{order.status}</span></td>
      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">{formatCurrency(order.totalAmount)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-[#68766e]">{formatDate(order.createdAt)}</td>
      {canDelete && <td className="px-4 py-3 text-right"><Button variant="quiet" className="min-h-8 px-2 text-xs" disabled={deleting} onClick={() => void handleDelete()}>{deleting ? 'Deleting…' : 'Delete'}</Button></td>}
    </tr>
  )
}