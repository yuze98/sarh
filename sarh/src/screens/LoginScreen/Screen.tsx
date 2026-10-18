import { LoginForm } from './components/LoginForm'

export default function LoginScreen() {
  return <main className="grid min-h-screen place-items-center bg-[#edf2ed] px-5 py-10"><section className="w-full max-w-sm rounded-md border border-[#dbe3dc] bg-white p-7"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#63806f]">SARH / Operations</p><h1 className="mt-2 text-2xl font-semibold text-[#1b2624]">Sign in</h1><p className="mb-6 mt-1 text-sm text-[#718077]">Orders Console</p><LoginForm /></section></main>
}