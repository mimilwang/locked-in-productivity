import { useEffect, useState } from 'react'
import LeagueOverviewPage from './LeagueOverviewPage'
import { getMyLeague, joinLeague } from '../services/leagueService'
import type { League } from '../services/leagueService'

export default function LeagueHomePage() {
  const [league, setLeague] = useState<League | null | undefined>(undefined)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyLeague().then(setLeague).catch((caught) => setError(caught instanceof Error ? caught.message : 'Could not load your league.'))
  }, [])

  async function join() {
    if (!inviteCode.trim()) return
    setJoining(true)
    setError('')
    try {
      setLeague(await joinLeague(inviteCode.trim()))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not join that league.')
    } finally {
      setJoining(false)
    }
  }

  if (league) return <LeagueOverviewPage />

  return <main className="league-gate"><style>{gateStyles}</style><header><a href="/overview"><b>ϟ</b> LOCKED IN</a><a href="/profile">Profile</a></header><section>{league === undefined && !error ? <p>Loading your clubhouse…</p> : <><p className="gate-kicker">YOUR CLUBHOUSE</p><h1>Find your people.<br />Start showing up.</h1><p className="gate-intro">You can belong to one private league. Create one for your crew or enter the invite code a friend sent you.</p>{error && <div className="gate-error">{error}</div>}<div className="gate-options"><article><span>01</span><h2>Start a league</h2><p>Choose the shared goal, reward, and last-place consequence.</p><a href="/create-league">Create your league →</a></article><article><span>02</span><h2>Join your crew</h2><p>League invite codes are private and can only be used by signed-in players.</p><label>INVITE CODE<input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="LOCKED24" /></label><button onClick={join} disabled={joining || !inviteCode.trim()}>{joining ? 'Joining…' : 'Join league →'}</button></article></div></>}</section></main>
}

const gateStyles = `
  *{box-sizing:border-box}body{margin:0;background:#f5f4ec}#root{width:100%;max-width:none;margin:0;border:0;text-align:left}.league-gate{min-height:100vh;background:#f5f4ec;color:#17231b;font-family:Inter,system-ui,sans-serif}.league-gate>header{height:68px;padding:0 clamp(20px,5vw,70px);display:flex;align-items:center;justify-content:space-between;background:#13271d}.league-gate>header a{color:white;text-decoration:none;font-size:11px}.league-gate>header a:first-child{font:800 20px Impact,sans-serif;letter-spacing:.05em}.league-gate>header b{color:#baff43;font-size:27px}.league-gate>section{width:min(940px,calc(100% - 36px));margin:0 auto;padding:70px 0}.gate-kicker{color:#75a424;font-size:10px;letter-spacing:.14em}.league-gate h1{margin:12px 0;color:#17231b;font:800 clamp(46px,7vw,78px)/.95 Impact,sans-serif}.gate-intro{max-width:620px;color:#727a73;line-height:1.6}.gate-options{margin-top:38px;display:grid;grid-template-columns:1fr 1fr;gap:18px}.gate-options article{padding:30px;border:1px solid #dbddd2;border-radius:8px;background:white}.gate-options article>span{color:#8ea067;font:800 13px monospace}.gate-options h2{margin:20px 0 8px;color:#17231b;font:800 28px Impact,sans-serif}.gate-options p{min-height:42px;color:#737b74;font-size:12px;line-height:1.5}.gate-options a,.gate-options button{min-height:46px;padding:0 16px;display:flex;align-items:center;justify-content:center;border:0;border-radius:5px;background:#baff43;color:#17231b;text-decoration:none;font-weight:900;cursor:pointer}.gate-options label{margin:18px 0 8px;display:grid;gap:6px;color:#737b74;font-size:9px}.gate-options input{min-height:45px;padding:0 12px;border:1px solid #d1d5cc;border-radius:5px;font:700 14px monospace;letter-spacing:.1em}.gate-options button{width:100%}.gate-options button:disabled{opacity:.5}.gate-error{margin-top:20px;padding:12px;background:#fff0ed;color:#8d2e21}@media(max-width:650px){.gate-options{grid-template-columns:1fr}.league-gate>section{padding:45px 0}}
`
