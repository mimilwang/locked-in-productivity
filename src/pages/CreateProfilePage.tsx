import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

type ProfileForm = {
  name: string
  displayName: string
  email: string
  password: string
  timeZone: string
}

const suggestedTimeZones = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
]

const initialForm: ProfileForm = {
  name: '',
  displayName: '',
  email: '',
  password: '',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
}

export default function CreateProfilePage() {
  const [form, setForm] = useState(initialForm)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoName, setPhotoName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const timeZones = useMemo(() => {
    const browserTimeZone = initialForm.timeZone
    return Array.from(new Set([browserTimeZone, ...suggestedTimeZones]))
  }, [])

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handlePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(URL.createObjectURL(file))
    setPhotoName(file.name)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    // Replace this state change with the profile creation request when the API is ready.
  }

  return (
    <main style={styles.page}>
      <section style={styles.brandPanel} aria-label="Locked In introduction">
        <a href="/" style={styles.logo} aria-label="Locked In home">
          <span style={styles.logoMark}>L</span>
          <span>LOCKED IN</span>
        </a>

        <div style={styles.brandCopy}>
          <p style={styles.eyebrow}>YOUR SEASON STARTS NOW</p>
          <h1 style={styles.heroTitle}>Build habits.<br />Beat your friends.</h1>
          <p style={styles.heroText}>
            Create your player profile and get ready to climb the leaderboard.
          </p>
        </div>

        <div style={styles.decorativeCard} aria-hidden="true">
          <span style={styles.decorativeNumber}>01</span>
          <div>
            <strong>Create your profile</strong>
            <p style={styles.decorativeText}>Next up: join your first league</p>
          </div>
        </div>
      </section>

      <section style={styles.formPanel}>
        <div style={styles.formContainer}>
          <div style={styles.mobileLogo}>LOCKED IN</div>
          <p style={styles.step}>PROFILE SETUP · 1 OF 1</p>
          <h2 style={styles.formTitle}>Create your profile</h2>
          <p style={styles.formIntro}>This is how your friends will recognize you in a league.</p>

          {submitted && (
            <div style={styles.success} role="status">
              Profile details are ready to send once the account API is connected.
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.photoRow}>
              <div style={styles.avatar}>
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile preview" style={styles.avatarImage} />
                ) : (
                  <span style={styles.avatarInitial}>{form.displayName.charAt(0).toUpperCase() || '?'}</span>
                )}
              </div>
              <div>
                <label htmlFor="profile-picture" style={styles.uploadButton}>Upload profile picture</label>
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhoto}
                  style={styles.hiddenInput}
                />
                <p style={styles.helperText}>{photoName || 'JPG, PNG or WebP · Max 5 MB'}</p>
              </div>
            </div>

            <div style={styles.twoColumns}>
              <Field label="Name" hint="Your full name">
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Jordan Lee"
                  autoComplete="name"
                  required
                  style={styles.input}
                />
              </Field>

              <Field label="Display name" hint="Shown on leaderboards">
                <input
                  id="displayName"
                  name="displayName"
                  value={form.displayName}
                  onChange={(event) => updateField('displayName', event.target.value)}
                  placeholder="jlee24"
                  autoComplete="nickname"
                  minLength={2}
                  maxLength={24}
                  required
                  style={styles.input}
                />
              </Field>
            </div>

            <Field label="Email">
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="jordan@college.edu"
                autoComplete="email"
                required
                style={styles.input}
              />
            </Field>

            <Field label="Password" hint="Use at least 8 characters">
              <div style={styles.passwordWrap}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="Create a secure password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  style={{ ...styles.input, paddingRight: '5.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  style={styles.showButton}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>

            <Field label="Time zone" hint="Used to calculate daily streaks">
              <select
                id="timeZone"
                name="timeZone"
                value={form.timeZone}
                onChange={(event) => updateField('timeZone', event.target.value)}
                required
                style={styles.input}
              >
                {timeZones.map((timeZone) => (
                  <option key={timeZone} value={timeZone}>{timeZone.replaceAll('_', ' ')}</option>
                ))}
              </select>
            </Field>

            <button type="submit" style={styles.submitButton}>Create profile <span aria-hidden="true">→</span></button>
            <p style={styles.terms}>By continuing, you agree to the league rules and community guidelines.</p>
          </form>
        </div>
      </section>
    </main>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  const id = label === 'Display name' ? 'displayName' : label.toLowerCase().replaceAll(' ', '-')

  return (
    <div style={styles.field}>
      <div style={styles.labelRow}>
        <label htmlFor={id} style={styles.label}>{label}</label>
        {hint && <span style={styles.hint}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
    background: '#f7f7f2',
    color: '#151714',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  brandPanel: {
    minHeight: '100vh',
    padding: 'clamp(2rem, 5vw, 4.5rem)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    background: '#17251c',
    color: '#f7f7f2',
  },
  logo: { color: '#f7f7f2', textDecoration: 'none', fontSize: '1rem', fontWeight: 900, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.65rem' },
  logoMark: { display: 'grid', placeItems: 'center', width: '2rem', height: '2rem', color: '#17251c', background: '#dfff4f', borderRadius: '0.45rem', fontSize: '1.1rem' },
  brandCopy: { maxWidth: '34rem', margin: '5rem 0' },
  eyebrow: { color: '#dfff4f', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.18em' },
  heroTitle: { margin: '1.1rem 0 1.5rem', fontSize: 'clamp(2.75rem, 5vw, 5.75rem)', lineHeight: 0.94, letterSpacing: '-0.055em' },
  heroText: { margin: 0, maxWidth: '29rem', color: '#bfc9c1', fontSize: '1.05rem', lineHeight: 1.65 },
  decorativeCard: { display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #3b493f', fontSize: '0.9rem' },
  decorativeNumber: { display: 'grid', placeItems: 'center', width: '2.6rem', height: '2.6rem', border: '1px solid #637066', borderRadius: '50%', color: '#dfff4f', fontWeight: 800 },
  decorativeText: { margin: '0.25rem 0 0', color: '#8f9b92', fontSize: '0.8rem' },
  formPanel: { display: 'grid', placeItems: 'center', padding: '3rem clamp(1.5rem, 7vw, 7rem)', boxSizing: 'border-box' },
  formContainer: { width: '100%', maxWidth: '640px' },
  mobileLogo: { display: 'none', marginBottom: '2rem', fontWeight: 900, letterSpacing: '0.08em' },
  step: { margin: '0 0 0.75rem', color: '#657168', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.13em' },
  formTitle: { margin: 0, fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.05, letterSpacing: '-0.045em' },
  formIntro: { margin: '0.85rem 0 2.25rem', color: '#687069', lineHeight: 1.6 },
  success: { padding: '0.9rem 1rem', marginBottom: '1.5rem', background: '#e7f2d0', border: '1px solid #c4dc96', borderRadius: '0.55rem', color: '#294018', fontSize: '0.88rem' },
  form: { display: 'grid', gap: '1.35rem' },
  photoRow: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' },
  avatar: { width: '72px', height: '72px', flex: '0 0 72px', overflow: 'hidden', display: 'grid', placeItems: 'center', borderRadius: '50%', background: '#e3e5dc', border: '2px solid #fff', boxShadow: '0 0 0 1px #cfd3c9' },
  avatarImage: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarInitial: { fontSize: '1.5rem', fontWeight: 800, color: '#687069' },
  uploadButton: { display: 'inline-block', padding: '0.65rem 0.85rem', border: '1px solid #bbc0b8', borderRadius: '0.5rem', background: '#fff', fontSize: '0.8rem', fontWeight: 750, cursor: 'pointer' },
  hiddenInput: { position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 },
  helperText: { margin: '0.45rem 0 0', color: '#7b837c', fontSize: '0.72rem' },
  twoColumns: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' },
  field: { display: 'grid', gap: '0.5rem' },
  labelRow: { minHeight: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' },
  label: { fontSize: '0.78rem', fontWeight: 800 },
  hint: { color: '#7b837c', fontSize: '0.7rem' },
  input: { width: '100%', minHeight: '48px', boxSizing: 'border-box', padding: '0.75rem 0.9rem', border: '1px solid #cfd3c9', borderRadius: '0.55rem', background: '#fff', color: '#151714', font: 'inherit', fontSize: '0.9rem', outlineColor: '#48613c' },
  passwordWrap: { position: 'relative' },
  showButton: { position: 'absolute', top: '50%', right: '0.9rem', transform: 'translateY(-50%)', padding: '0.3rem', border: 0, background: 'transparent', color: '#42563c', fontWeight: 800, cursor: 'pointer' },
  submitButton: { minHeight: '52px', marginTop: '0.35rem', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 0, borderRadius: '0.55rem', background: '#dfff4f', color: '#17251c', font: 'inherit', fontWeight: 900, cursor: 'pointer' },
  terms: { margin: '-0.35rem 0 0', textAlign: 'center', color: '#7b837c', fontSize: '0.7rem', lineHeight: 1.5 },
}
