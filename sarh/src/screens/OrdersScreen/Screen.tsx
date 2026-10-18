import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { Spinner } from '../../components/Spinner'
import { STORAGE_KEYS } from '../../constants/orders'
import { useAuth } from '../../hooks/useAuth'
import { useOrders } from '../../hooks/useOrders'
import { ordersService } from '../../services/ordersService'
import type { Order, OrderStatus } from '../../types/order'
import { OrdersFilters } from './components/OrdersFilters'
import { OrdersTable } from './components/OrdersTable'
import { Pagination } from './components/Pagination'

export default function OrdersScreen() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState(() => sessionStorage.getItem(STORAGE_KEYS.lastOrderSearch) ?? '')
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [sort, setSort] = useState<'created_at' | 'total_amount'>('created_at')
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc')
  const { orders, loading, loadingMore, error, hasMore, loadMore, removeOrder } = useOrders(search, status, sort, direction)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.lastOrderSearch, search)
  }, [search])

  function changeSort(column: 'created_at' | 'total_amount'): void {
    if (sort === column) setDirection((current) => current === 'asc' ? 'desc' : 'asc')
    else { setSort(column); setDirection('desc') }
  }

  async function deleteOrder(order: Order): Promise<void> {
    await ordersService.remove(order.id)
    removeOrder(order.id)
  }

  async function signOut(): Promise<void> {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-[#f4f6f3] text-[#1b2624]">
      <header className="border-b border-[#dce4dd] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#63806f]">SARH / Operations</p><p className="mt-1 text-lg font-semibold">Orders Console</p></div>
          <div className="flex items-center gap-3"><span className="hidden text-xs text-[#718077] sm:inline">{user?.role}</span><Button variant="quiet" className="min-h-9 px-3" onClick={() => void signOut()}>Sign out</Button></div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#dce4dd] pb-5">
          <div><p className="text-xs font-medium uppercase tracking-[0.12em] text-[#738178]">Order management</p><h1 className="mt-1 text-2xl font-semibold">All orders</h1></div>
          <Button onClick={() => navigate('/orders/new')}>Create order <span aria-hidden="true">+</span></Button>
        </div>
        <OrdersFilters search={search} status={status} onSearchChange={setSearch} onStatusChange={setStatus} />
        <div className="mt-4 overflow-hidden rounded-md border border-[#e1e7e1] bg-white">
          {loading ? <div className="flex min-h-64 items-center justify-center"><Spinner label="Loading orders" /></div>
            : error ? <div className="p-6"><ErrorState message={error} /></div>
              : orders.length === 0 ? <div className="grid min-h-64 place-content-center gap-2 px-6 text-center"><p className="font-medium">No orders found</p><p className="text-sm text-[#77847c]">Try a different search or status.</p></div>
                : <><OrdersTable orders={orders} canDelete={user?.role === 'admin'} sort={sort} direction={direction} onSortChange={changeSort} onDelete={deleteOrder} /><Pagination count={orders.length} hasMore={hasMore} loadingMore={loadingMore} onLoadMore={loadMore} /></>}
        </div>
        <div className="mt-5 flex justify-end"><Link className="text-xs text-[#7a867f] hover:text-[#19594b]" to="/orders/new">New order</Link></div>
      </section>
    </main>
  )
}