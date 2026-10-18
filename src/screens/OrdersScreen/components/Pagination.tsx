import { Button } from '../../../components/Button'
import { Spinner } from '../../../components/Spinner'

export function Pagination({ count, hasMore, loadingMore, onLoadMore }: { count: number; hasMore: boolean; loadingMore: boolean; onLoadMore(): Promise<void> }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 border-t border-[#e1e7e1] px-4 py-3">
      <p className="text-xs text-[#77847c]">Showing {count} orders</p>
      {loadingMore ? <Spinner label="Loading more" /> : hasMore ? <Button variant="secondary" onClick={() => void onLoadMore()}>Load more</Button> : <span className="text-xs text-[#77847c]">End of results</span>}
    </div>
  )
}