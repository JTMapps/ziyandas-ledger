import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let result:
      | Awaited<ReturnType<typeof supabase.auth.signUp>>
      | Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>

    if (mode === 'signup') {
      result = await supabase.auth.signUp({
        email,
        password,
      })
    } else {
      result = await supabase.auth.signInWithPassword({
        email,
        password,
      })
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    } else {
      navigate('/profile')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-96 border rounded p-6 space-y-4">
        <h1 className="text-xl font-bold">
          {mode === 'signup' ? 'Create Account' : 'Sign In'}
        </h1>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <input
          type="email"
          required
          placeholder="Email"
          className="w-full border p-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          required
          placeholder="Password"
          className="w-full border p-2"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading} className="w-full bg-black text-white p-2">
          {loading ? 'Please wait…' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
        </button>

        <p className="text-sm text-center">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button type="button" className="underline" onClick={() => setMode('signin')}>
                Sign in
              </button>
            </>
          ) : (
            <>
              Don’t have an account?{' '}
              <button type="button" className="underline" onClick={() => setMode('signup')}>
                Sign up
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  )
}
