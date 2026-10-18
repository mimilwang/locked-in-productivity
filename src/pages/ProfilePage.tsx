import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { cachedUser, getMyProfile, logout, updateMyProfile } from '../services/authService'
import type { UserProfile } from '../types/api'
import AppSidebar from '../components/AppSidebar'

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(() => cachedUser())
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({ name: '', displayName: '', school: '', timeZone: '', photoUrl: '' })

  useEffect(() => {
    getMyProfile().then(setProfile).catch((caught) => setError(caught instanceof Error ? caught.message : 'Could not load profile.'))
  }, [])

  function beginEditing() {
    if (!profile) return
    setDraft({ name: profile.name, displayName: profile.displayName, school: profile.school ?? '', timeZone: profile.timeZone, photoUrl: profile.photoUrl ?? '' })
    setEditing(true)
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      setProfile(await updateMyProfile(draft))
      setEditing(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-page-with-sidebar">
      <AppSidebar active="profile" />
      <main className="profile-page">
        <style>{profileStyles}</style>
        <section className="profile-shell">
          {error && <div className="profile-error">{error}</div>}
          {!profile ? <p>Loading profile…</p> : <>
            <div className="profile-hero">
              <div className="profile-avatar">{profile.photoUrl ? <img src={profile.photoUrl} alt="" /> : initials(profile.name)}</div>
              <div className="profile-identity"><p>PLAYER PROFILE</p><h1>{profile.displayName}</h1><span>{profile.name}{profile.school ? ` · ${profile.school}` : ''}</span></div>
              <button className="edit-profile" onClick={beginEditing}>Edit profile</button>
            </div>
            {editing && <form className="profile-edit" onSubmit={saveProfile}>
              <label>Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label>
              <label>Display name<input value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} required /></label>
              <label>School<input value={draft.school} onChange={(event) => setDraft({ ...draft, school: event.target.value })} placeholder="University of Washington" /></label>
              <label>Time zone<input value={draft.timeZone} onChange={(event) => setDraft({ ...draft, timeZone: event.target.value })} required /></label>
              <label className="profile-edit-wide">Profile photo URL<input type="url" value={draft.photoUrl} onChange={(event) => setDraft({ ...draft, photoUrl: event.target.value })} placeholder="https://…" /></label>
              <div className="profile-edit-actions"><button type="button" onClick={() => setEditing(false)}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
            </form>}
            <div className="profile-stats">
              <article><span>CURRENT STREAK</span><strong>{profile.currentStreak}</strong><small>days</small></article>
              <article><span>PERSONAL BEST</span><strong>{profile.bestStreak}</strong><small>days</small></article>
              <article><span>BADGES</span><strong>{profile.badges.length}</strong><small>earned</small></article>
              <article><span>TITLES</span><strong>{profile.titles.length}</strong><small>all time</small></article>
            </div>
            <div className="profile-grid">
              <section><p>ACCOUNT DETAILS</p><dl><div><dt>Name</dt><dd>{profile.name}</dd></div><div><dt>Display name</dt><dd>{profile.displayName}</dd></div><div><dt>School</dt><dd>{profile.school || 'Not added'}</dd></div><div><dt>Email</dt><dd>{profile.email}</dd></div><div><dt>Time zone</dt><dd>{profile.timeZone.replaceAll('_', ' ')}</dd></div></dl></section>
              <section><p>LEAGUE HISTORY</p>{profile.titles.length ? profile.titles.map((title) => <div className="profile-title" key={`${title.leagueId}-${title.month}`}><strong>{title.title === 'MVP' ? '🏆 MVP' : 'CHUD'}</strong><span>{title.leagueName} · {title.month}</span></div>) : <div className="profile-empty">No titles yet. This month is still yours.</div>}</section>
            </div>
            <button className="logout" onClick={logout}>Log out</button>
          </>}
        </section>
      </main>
    </div>
  )
}

const profileStyles = `
  *{box-sizing:border-box}body{margin:0;background:#faf6ec}#root{width:100%;max-width:none;margin:0;border:0;text-align:left}.profile-page{min-height:100vh;background:#faf6ec;color:#0f1c33;font-family:Inter,system-ui,sans-serif}.profile-shell{width:min(960px,calc(100% - 36px));margin:0 auto;padding:55px 0}.profile-hero{padding:34px;display:flex;gap:22px;align-items:center;border-radius:8px;background:#0f1f3d;color:white}.profile-avatar{width:92px;height:92px;overflow:hidden;display:grid;place-items:center;border-radius:50%;background:#f4d35e;color:#0f1c33;font:800 28px Impact,sans-serif}.profile-avatar img{width:100%;height:100%;object-fit:cover}.profile-identity{flex:1}.profile-hero p,.profile-grid>section>p{margin:0;color:#f4d35e;font-size:9px;letter-spacing:.13em}.profile-hero h1{margin:8px 0 5px;color:white;font:800 45px Impact,sans-serif}.profile-hero span{color:#aebbb1;font-size:12px}.edit-profile{padding:10px 14px;border:1px solid #53675b;border-radius:5px;background:transparent;color:white;font-weight:800;cursor:pointer}.profile-edit{margin-top:18px;padding:22px;display:grid;grid-template-columns:1fr 1fr;gap:14px;border:1px solid #dbddd2;border-radius:7px;background:white}.profile-edit label{display:grid;gap:6px;color:#687069;font-size:10px;font-weight:800}.profile-edit input{min-height:44px;padding:0 11px;border:1px solid #cfd3c9;border-radius:5px;font:inherit}.profile-edit-wide,.profile-edit-actions{grid-column:1/-1}.profile-edit-actions{display:flex;justify-content:flex-end;gap:8px}.profile-edit-actions button{padding:10px 14px;border:1px solid #b8beb5;border-radius:5px;background:white;font-weight:800;cursor:pointer}.profile-edit-actions button[type=submit]{border-color:#f4d35e;background:#f4d35e}.profile-stats{margin:18px 0;display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #dbddd2;border-radius:7px;background:#fff}.profile-stats article{padding:22px;border-right:1px solid #e3e4dc}.profile-stats article:last-child{border:0}.profile-stats span{display:block;color:#7b827b;font-size:9px}.profile-stats strong{font:800 30px Impact,sans-serif}.profile-stats small{margin-left:5px;color:#7b827b}.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.profile-grid>section{padding:25px;border:1px solid #dbddd2;border-radius:7px;background:white}.profile-grid dl{margin:16px 0 0}.profile-grid dl div{padding:12px 0;display:flex;justify-content:space-between;gap:20px;border-top:1px solid #ecece7;font-size:11px}.profile-grid dt{color:#7b827b}.profile-grid dd{margin:0;font-weight:700;text-align:right}.profile-title,.profile-empty{margin-top:14px;padding:13px;border-radius:5px;background:#fbf1cf;font-size:11px}.profile-title{display:flex;justify-content:space-between}.profile-title span,.profile-empty{color:#6f786f}.logout{margin-top:20px;padding:11px 18px;border:1px solid #b8beb5;border-radius:5px;background:transparent;color:#334137;font-weight:800;cursor:pointer}.profile-error{padding:12px;background:#fff0ed;color:#8d2e21}@media(max-width:650px){.profile-stats,.profile-edit{grid-template-columns:1fr 1fr}.profile-edit label{grid-column:1/-1}.profile-stats article:nth-child(2){border-right:0}.profile-grid{grid-template-columns:1fr}.profile-hero{align-items:flex-start;flex-wrap:wrap}.profile-hero h1{font-size:34px}}
`
