import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { Input } from '../../../components/Input'
import { Spinner } from '../../../components/Spinner'
import { useAuth } from '../../../hooks/useAuth'

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/orders', { replace: true })
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return <form className="grid gap-4" onSubmit={(event) => void submit(event)}><Input label="Email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required maxLength={254} /><Input label="Password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required maxLength={256} />{error && <p className="text-sm text-[#a03e32]" role="alert">{error}</p>}<Button type="submit" className="mt-2 w-full" disabled={submitting}>{submitting ? <Spinner label="Signing in" /> : 'Sign in'}</Button></form>
}