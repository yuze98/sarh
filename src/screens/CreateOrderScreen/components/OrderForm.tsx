import { useState } from 'react'
import { createOrderSchema, type CreateOrderInput } from '../../../types/order'
import { formatCurrency } from '../../../utils/formatCurrency'
import { generateIdempotencyKey } from '../../../utils/generateIdempotencyKey'
import { Button } from '../../../components/Button'
import { Input } from '../../../components/Input'
import { Spinner } from '../../../components/Spinner'
import { ordersService } from '../../../services/ordersService'
import { ItemDraft, OrderItemFields } from './OrderItemFields'

const initialItems = (): ItemDraft[] => [{ name: '', quantity: '1', unitPrice: '' }]

export function OrderForm({ onCreated }: { onCreated(orderId: string): void }) {
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [items, setItems] = useState<ItemDraft[]>(initialItems)
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const total = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0)

  function changeItem(index: number, field: keyof ItemDraft, value: string): void {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  }

  function resetForm(): void {
    setCustomerName('')
    setCustomerEmail('')
    setItems(initialItems())
    setErrors({})
    setSubmitError(null)
    setIdempotencyKey(generateIdempotencyKey())
  }

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setSubmitError(null)
    const candidate: CreateOrderInput = {
      customerName,
      customerEmail,
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity.trim() === '' ? Number.NaN : Number(item.quantity),
        unitPrice: item.unitPrice.trim() === '' ? Number.NaN : Number(item.unitPrice),
      })),
    }
    const parsed = createOrderSchema.safeParse(candidate)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.')
        if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      const order = await ordersService.create(parsed.data, idempotencyKey)
      setIdempotencyKey(generateIdempotencyKey())
      resetFormAfterSuccess()
      onCreated(order.id)
    } catch (cause: unknown) {
      setSubmitError(cause instanceof Error ? cause.message : 'Unable to create order. Please retry.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetFormAfterSuccess(): void {
    setCustomerName('')
    setCustomerEmail('')
    setItems(initialItems())
    setErrors({})
  }

  return (
    <form className="grid gap-6" onSubmit={(event) => void submit(event)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Customer name" name="customerName" value={customerName} error={errors.customerName} onChange={(event) => setCustomerName(event.target.value)} maxLength={120} autoComplete="name" />
        <Input label="Customer email" name="customerEmail" type="email" value={customerEmail} error={errors.customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} maxLength={254} autoComplete="email" />
      </div>
      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Line items</h2><span className="text-xs text-[#76837b]">1–5 items</span></div>
        <OrderItemFields items={items} errors={errors} onChange={changeItem} onAdd={() => setItems((current) => [...current, { name: '', quantity: '1', unitPrice: '' }])} onRemove={(index) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
      </section>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e1e7e1] pt-5">
        <p className="text-sm text-[#6c7971]">Order total <strong className="ml-2 text-lg text-[#1b2624]">{formatCurrency(total)}</strong></p>
        <div className="flex gap-2"><Button type="button" variant="secondary" disabled={submitting} onClick={resetForm}>Reset</Button><Button type="submit" disabled={submitting}>{submitting ? <Spinner label="Saving" /> : 'Create order'}</Button></div>
      </div>
      {submitError && <p className="text-sm text-[#a03e32]" role="alert">{submitError}</p>}
    </form>
  )
}