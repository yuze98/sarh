import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Paginated } from '../types/api'
import type { Order, OrderStatus } from '../types/order'

const { list } = vi.hoisted(() => ({ list: vi.fn() }))
vi.mock('../services/ordersService', () => ({ ordersService: { list } }))

import { useOrders } from './useOrders'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => { resolve = complete })
  return { promise, resolve }
}

const order = (id: string): Order => ({
  id,
  customerName: `Customer ${id}`,
  customerEmail: `${id}@example.com`,
  status: 'pending',
  totalAmount: 20,
  createdAt: '2026-10-01T00:00:00.000Z',
  items: [],
})

describe('useOrders request ordering', () => {
  beforeEach(() => {
    list.mockReset()
  })

  it('does not let slower earlier responses replace the latest of rapid query changes', async () => {
    const earlier = deferred<Paginated<Order>>()
    const middle = deferred<Paginated<Order>>()
    const recent = deferred<Paginated<Order>>()
    const latest = deferred<Paginated<Order>>()
    list.mockReturnValueOnce(earlier.promise).mockReturnValueOnce(middle.promise).mockReturnValueOnce(recent.promise).mockReturnValueOnce(latest.promise)
    const { result, rerender } = renderHook(({ search, status, sort, direction }) => useOrders(search, status, sort, direction), {
      initialProps: {
        search: '',
        status: '' as OrderStatus | '',
        sort: 'created_at' as 'created_at' | 'total_amount',
        direction: 'desc' as 'asc' | 'desc',
      },
    })
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1))

    rerender({ search: '', status: 'paid', sort: 'created_at', direction: 'desc' })
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    rerender({ search: '', status: 'paid', sort: 'total_amount', direction: 'desc' })
    await waitFor(() => expect(list).toHaveBeenCalledTimes(3))
    rerender({ search: '', status: 'paid', sort: 'total_amount', direction: 'asc' })
    await waitFor(() => expect(list).toHaveBeenCalledTimes(4))

    latest.resolve({ items: [order('latest')], nextCursor: null })
    await waitFor(() => expect(result.current.orders[0]?.id).toBe('latest'))

    recent.resolve({ items: [order('recent')], nextCursor: null })
    middle.resolve({ items: [order('middle')], nextCursor: null })
    earlier.resolve({ items: [order('earlier')], nextCursor: null })
    await act(async () => { await Promise.resolve() })
    expect(result.current.orders.map(({ id }) => id)).toEqual(['latest'])
  })
})