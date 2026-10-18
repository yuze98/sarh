export interface ApiErrorBody {
  error: string
  details?: unknown
}

export interface Paginated<T> {
  items: T[]
  nextCursor: string | null
}