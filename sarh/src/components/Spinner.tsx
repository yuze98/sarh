export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <span className="inline-flex items-center gap-2 text-sm text-[#64736a]" role="status"><span className="size-4 animate-spin rounded-full border-2 border-[#b9c9bd] border-t-[#19594b]" />{label}</span>
}