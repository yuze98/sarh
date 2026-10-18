import { Navigate, Outlet } from 'react-router-dom'
import { Spinner } from './Spinner'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <main className="grid min-h-screen place-items-center"><Spinner label="Checking session" /></main>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}