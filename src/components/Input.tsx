import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  const id = props.id ?? props.name
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[#34433c]" htmlFor={id}>
      {label}
      <input {...props} id={id} className={`min-h-10 rounded-md border border-[#d7dfd9] bg-white px-3 text-sm font-normal text-[#1b2624] outline-none placeholder:text-[#9aa69e] focus:border-[#548b77] focus:ring-2 focus:ring-[#548b77]/15 ${error ? 'border-[#b94738]' : ''} ${className}`} />
      {error && <span className="text-xs font-normal text-[#b94738]">{error}</span>}
    </label>
  )
}