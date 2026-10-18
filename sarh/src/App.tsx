import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Spinner } from './components/Spinner'
import { useAuth } from './hooks/useAuth'
import CreateOrderScreen from './screens/CreateOrderScreen/Screen'
import LoginScreen from './screens/LoginScreen/Screen'
import OrdersScreen from './screens/OrdersScreen/Screen'

function App() {
  const { user, loading } = useAuth()
  if (loading) return <main className="grid min-h-screen place-items-center"><Spinner label="Checking session" /></main>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/orders" replace /> : <LoginScreen />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/orders" element={<OrdersScreen />} />
        <Route path="/orders/new" element={<CreateOrderScreen />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/orders' : '/login'} replace />} />
    </Routes>
  )
}

export default App
