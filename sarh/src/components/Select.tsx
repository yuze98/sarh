import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
}

export function Select({ label, className = '', children, ...props }: SelectProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[#34433c]">
      {label}
      <select {...props} className={`min-h-10 rounded-md border border-[#d7dfd9] bg-white px-3 text-sm outline-none focus:border-[#548b77] focus:ring-2 focus:ring-[#548b77]/15 ${className}`}>{children}</select>
    </label>
  )
}