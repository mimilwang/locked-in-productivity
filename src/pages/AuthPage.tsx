import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { login, signUp } from '../services/authService'

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [school, setSchool] = useState('')
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isLogin = mode === 'login'
  const title = useMemo(() => isLogin ? 'Welcome back.' : 'Build your player profile.', [isLogin])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isLogin) await login(email, password)
      else await signUp({ name, displayName, email, password, timeZone, school })
      window.location.assign('/overview')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <style>{authStyles}</style>
      <section className="auth-brand">
        <a href="/login"><b>ϟ</b> LOCKED IN</a>
        <div><p>FANTASY SPORTS ENERGY.<br />REAL-LIFE PROGRESS.</p><h1>Show up.<br />Score points.<br />Stay locked in.</h1></div>
        <small>Private leagues. Shared wins.</small>
      </section>
      <section className="auth-form-panel">
        <form onSubmit={submit}>
          <p className="auth-kicker">{isLogin ? 'PLAYER LOGIN' : 'CREATE AN ACCOUNT'}</p>
          <h2>{title}</h2>
          <p className="auth-intro">{isLogin ? 'Sign in to get back to your league.' : 'Join your friends and turn consistency into competition.'}</p>
          {error && <div className="auth-error" role="alert">{error}</div>}
          {!isLogin && <div className="auth-grid"><label>Name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label><label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="nickname" required /></label></div>}
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={8} required /></label>
          {!isLogin && <label>School or university<input value={school} onChange={(event) => setSchool(event.target.value)} autoComplete="organization" placeholder="University of Washington" /></label>}
          {!isLogin && <label>Time zone<select value={timeZone} onChange={(event) => setTimeZone(event.target.value)}><option>America/Los_Angeles</option><option>America/Denver</option><option>America/Chicago</option><option>America/New_York</option><option>Europe/London</option><option>Asia/Tokyo</option><option>{timeZone}</option></select></label>}
          <button type="submit" disabled={loading}>{loading ? 'Please wait…' : isLogin ? 'Log in →' : 'Create account →'}</button>
          <p className="auth-switch">{isLogin ? 'New to Locked In?' : 'Already have an account?'} <a href={isLogin ? '/signup' : '/login'}>{isLogin ? 'Create an account' : 'Log in'}</a></p>
        </form>
      </section>
    </main>
  )
}

const authStyles = `
  * { box-sizing: border-box; } body { margin: 0; background: #faf6ec; } #root { width: 100%; max-width: none; margin: 0; border: 0; text-align: left; }
  .auth-page { min-height: 100vh; display: grid; grid-template-columns: minmax(330px,.9fr) minmax(480px,1.1fr); font-family: Inter,system-ui,sans-serif; color:#0f1c33; }
  .auth-brand { padding: clamp(30px,5vw,70px); display:flex; flex-direction:column; justify-content:space-between; background:#0f1f3d; color:white; }
  .auth-brand a { color:white; text-decoration:none; font:800 22px Impact,sans-serif; letter-spacing:.06em; }.auth-brand a b { color:#f4d35e; font-size:30px; }
  .auth-brand p,.auth-kicker { color:#f4d35e; font-size:10px; letter-spacing:.14em; }.auth-brand h1 { margin:20px 0 0; font:800 clamp(44px,6vw,78px)/.95 Impact,sans-serif; letter-spacing:.02em; }.auth-brand small { color:#8fa096; }
  .auth-form-panel { padding:42px 24px; display:grid; place-items:center; }.auth-form-panel form { width:min(520px,100%); }.auth-form-panel h2 { margin:8px 0; color:#0f1c33; font:800 clamp(34px,5vw,52px)/1 Impact,sans-serif; }.auth-intro { margin:0 0 28px; color:#747a74; }
  .auth-form-panel label { margin:0 0 16px; display:grid; gap:7px; font-size:11px; font-weight:800; }.auth-form-panel input,.auth-form-panel select { width:100%; min-height:48px; padding:0 13px; border:1px solid #cfd3c9; border-radius:5px; background:white; color:#0f1c33; font:inherit; }.auth-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .auth-form-panel button { width:100%; min-height:52px; margin-top:7px; border:0; border-radius:5px; background:#f4d35e; color:#0f1c33; font-weight:900; cursor:pointer; }.auth-form-panel button:disabled { opacity:.6; cursor:wait; }.auth-error { margin-bottom:18px; padding:12px; border:1px solid #e3b2a9; border-radius:5px; background:#fff0ed; color:#8d2e21; font-size:12px; }
  .auth-switch { margin-top:18px; text-align:center; color:#747a74; font-size:11px; }.auth-switch a { color:#2b4677; font-weight:800; }
  @media(max-width:760px){.auth-page{display:block}.auth-brand{min-height:270px}.auth-brand small{display:none}.auth-brand h1{font-size:44px}.auth-form-panel{padding:36px 20px}.auth-grid{grid-template-columns:1fr}}
`
