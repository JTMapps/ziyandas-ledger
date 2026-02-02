import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('signin') // signin | signup

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let result

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
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-96 border rounded p-6 space-y-4"
      >
        <h1 className="text-xl font-bold">
          {mode === 'signup' ? 'Create Account' : 'Sign In'}
        </h1>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-2"
        >
          {loading
            ? 'Please wait...'
            : mode === 'signup'
            ? 'Sign Up'
            : 'Sign In'}
        </button>

        <p className="text-sm text-center">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="underline"
                onClick={() => setMode('signin')}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don’t have an account?{' '}
              <button
                type="button"
                className="underline"
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  )
}
