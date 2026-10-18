import { Button } from '../../../components/Button'
import { Input } from '../../../components/Input'

export interface ItemDraft {
  name: string
  quantity: string
  unitPrice: string
}

interface OrderItemFieldsProps {
  items: ItemDraft[]
  errors: Record<string, string>
  onChange(index: number, field: keyof ItemDraft, value: string): void
  onAdd(): void
  onRemove(index: number): void
}

export function OrderItemFields({ items, errors, onChange, onAdd, onRemove }: OrderItemFieldsProps) {
  return (
    <div className="grid gap-4">
      {items.map((item, index) => (
        <fieldset key={index} className="grid gap-3 border-b border-[#e4e9e4] pb-4 last:border-0 sm:grid-cols-[minmax(180px,1fr)_110px_150px_auto] sm:items-end">
          <legend className="mb-3 text-sm font-semibold text-[#36463e]">Item {index + 1}</legend>
          <Input label="Item name" name={`items.${index}.name`} value={item.name} error={errors[`items.${index}.name`]} onChange={(event) => onChange(index, 'name', event.target.value)} maxLength={120} />
          <Input label="Quantity" name={`items.${index}.quantity`} type="number" min="1" max="999" value={item.quantity} error={errors[`items.${index}.quantity`]} onChange={(event) => onChange(index, 'quantity', event.target.value)} />
          <Input label="Unit price" name={`items.${index}.unitPrice`} type="number" min="0" max="1000000" step="0.01" value={item.unitPrice} error={errors[`items.${index}.unitPrice`]} onChange={(event) => onChange(index, 'unitPrice', event.target.value)} />
          {items.length > 1 && <Button type="button" variant="quiet" className="min-h-10 px-2 text-xs" aria-label={`Remove item ${index + 1}`} onClick={() => onRemove(index)}>Remove</Button>}
        </fieldset>
      ))}
      {items.length < 5 && <Button type="button" variant="secondary" className="justify-self-start" onClick={onAdd}>Add item <span aria-hidden="true">+</span></Button>}
    </div>
  )
}