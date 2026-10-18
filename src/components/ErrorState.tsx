import { Button } from './Button'

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="flex flex-col items-start gap-3 border-l-2 border-[#b94738] py-3 pl-4" role="alert"><p className="text-sm text-[#713b32]">{message}</p>{onRetry && <Button variant="secondary" onClick={onRetry}>Retry</Button>}</div>
}