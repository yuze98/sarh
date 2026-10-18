import type { Order } from '../../../types/order'
import { OrdersRow } from './OrdersRow'

interface OrdersTableProps {
  orders: Order[]
  canDelete: boolean
  sort: 'created_at' | 'total_amount'
  direction: 'asc' | 'desc'
  onSortChange(key: 'created_at' | 'total_amount'): void
  onDelete(order: Order): Promise<void>
}

function SortButton({ label, column, sort, direction, onChange }: {
  label: string
  column: 'created_at' | 'total_amount'
  sort: 'created_at' | 'total_amount'
  direction: 'asc' | 'desc'
  onChange(column: 'created_at' | 'total_amount'): void
}) {
  return <button className="inline-flex items-center gap-1 font-semibold text-[#65736b] hover:text-[#19594b]" onClick={() => onChange(column)}>{label}{sort === column && <span aria-label={direction === 'asc' ? 'ascending' : 'descending'}>{direction === 'asc' ? '↑' : '↓'}</span>}</button>
}

export function OrdersTable({ orders, canDelete, sort, direction, onSortChange, onDelete }: OrdersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[#f7f9f6] text-xs uppercase tracking-[0.08em]">
          <tr className="border-y border-[#e1e7e1]">
            <th className="px-4 py-3 font-semibold text-[#65736b]">Order</th>
            <th className="px-4 py-3 font-semibold text-[#65736b]">Customer</th>
            <th className="px-4 py-3 font-semibold text-[#65736b]">Status</th>
            <th className="px-4 py-3 text-right"><SortButton label="Total" column="total_amount" sort={sort} direction={direction} onChange={onSortChange} /></th>
            <th className="px-4 py-3"><SortButton label="Created" column="created_at" sort={sort} direction={direction} onChange={onSortChange} /></th>
            {canDelete && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>{orders.map((order) => <OrdersRow key={order.id} order={order} canDelete={canDelete} onDelete={onDelete} />)}</tbody>
      </table>
    </div>
  )
}