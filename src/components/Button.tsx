import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger'
  children: ReactNode
}

const variants = {
  primary: 'bg-[#19594b] text-white hover:bg-[#124b3f]',
  secondary: 'border border-[#d6ddd7] bg-white text-[#26332f] hover:bg-[#f6f8f6]',
  quiet: 'text-[#52635c] hover:bg-[#eef2ee]',
  danger: 'border border-[#e9c6bc] bg-[#fff9f7] text-[#9d4434] hover:bg-[#fdf0ec]',
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>
}