import { useEffect, useRef, useState } from 'react'
import { ORDER_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '../constants/orders'
import { ordersService } from '../services/ordersService'
import type { Order, OrderStatus } from '../types/order'
import { useDebouncedValue } from './useDebouncedValue'

export function useOrders(search: string, status: OrderStatus | '', sort: 'created_at' | 'total_amount', direction: 'asc' | 'desc') {
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  const [orders, setOrders] = useState<Order[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestSequence = useRef(0)
  const activeController = useRef<AbortController | null>(null)

  useEffect(() => {
    activeController.current?.abort()
    const controller = new AbortController()
    activeController.current = controller
    const requestId = ++requestSequence.current
    setLoading(true)
    setError(null)
    setOrders([])
    setNextCursor(null)

    ordersService.list({ search: debouncedSearch, status, sort, direction, limit: ORDER_PAGE_SIZE }, controller.signal)
      .then((page) => {
        if (requestId !== requestSequence.current) return
        setOrders(page.items)
        setNextCursor(page.nextCursor)
      })
      .catch((cause: unknown) => {
        if (requestId !== requestSequence.current || (cause instanceof DOMException && cause.name === 'AbortError')) return
        setError(cause instanceof Error ? cause.message : 'Unable to load orders')
      })
      .finally(() => {
        if (requestId === requestSequence.current) setLoading(false)
      })

    return () => controller.abort()
  }, [debouncedSearch, status, sort, direction])

  async function loadMore(): Promise<void> {
    if (!nextCursor || loadingMore) return
    activeController.current?.abort()
    const controller = new AbortController()
    activeController.current = controller
    const requestId = ++requestSequence.current
    setLoadingMore(true)
    setError(null)

    try {
      const page = await ordersService.list({ search: debouncedSearch, status, sort, direction, limit: ORDER_PAGE_SIZE, cursor: nextCursor }, controller.signal)
      if (requestId !== requestSequence.current) return
      setOrders((current) => [...current, ...page.items])
      setNextCursor(page.nextCursor)
    } catch (cause: unknown) {
      if (requestId === requestSequence.current && !(cause instanceof DOMException && cause.name === 'AbortError')) {
        setError(cause instanceof Error ? cause.message : 'Unable to load more orders')
      }
    } finally {
      if (requestId === requestSequence.current) setLoadingMore(false)
    }
  }

  function removeOrder(id: string): void {
    setOrders((current) => current.filter((order) => order.id !== id))
  }

  return { orders, loading, loadingMore, error, hasMore: nextCursor !== null, loadMore, removeOrder }
}