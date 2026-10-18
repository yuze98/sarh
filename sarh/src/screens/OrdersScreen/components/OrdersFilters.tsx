import type { OrderStatus } from '../../../types/order'
import { Input } from '../../../components/Input'
import { Select } from '../../../components/Select'

interface OrdersFiltersProps {
  search: string
  status: OrderStatus | ''
  onSearchChange(value: string): void
  onStatusChange(value: OrderStatus | ''): void
}

export function OrdersFilters({ search, status, onSearchChange, onStatusChange }: OrdersFiltersProps) {
  return (
    <div className="grid gap-4 border-b border-[#e1e7e1] py-4 sm:grid-cols-[minmax(240px,1fr)_190px]">
      <Input label="Search customer" name="search" type="search" placeholder="Name or email" value={search} onChange={(event) => onSearchChange(event.target.value)} />
      <Select label="Status" value={status} onChange={(event) => onStatusChange(event.target.value as OrderStatus | '')}>
        <option value="">All statuses</option>
        {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((option) => <option key={option} value={option}>{option[0]!.toUpperCase() + option.slice(1)}</option>)}
      </Select>
    </div>
  )
}