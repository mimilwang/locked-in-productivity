import { cachedUser } from '../services/authService'
import { getCachedLeague } from '../services/leagueService'
import './AppSidebar.css'
import { resolveImageUrl } from '../services/imageService'

export type SidebarPage =
  | 'leagues'
  | 'dashboard'
  | 'activity'
  | 'feed'
  | 'leaderboard'
  | 'awards'
  | 'challenges'
  | 'profile'

const links: Array<{ id: SidebarPage; label: string; href: string; icon: string }> = [
  { id: 'leagues', label: 'Your leagues', href: '/overview', icon: '⚑' },
  { id: 'dashboard', label: 'Dashboard', href: '/league', icon: '▦' },
  { id: 'activity', label: 'Log activity', href: '/timer', icon: '✓' },
  { id: 'feed', label: 'Live feed', href: '/feed', icon: '◉' },
  { id: 'leaderboard', label: 'Leaderboard', href: '/leaderboard', icon: '▥' },
  { id: 'challenges', label: 'Daily challenges', href: '/daily-challenges', icon: '◎' },
  { id: 'awards', label: 'Monthly recap', href: '/monthly-awards', icon: '♕' },
]

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

export default function AppSidebar({ active, clubhouseOnly = false }: { active: SidebarPage; clubhouseOnly?: boolean }) {
  const user = cachedUser()
  const league = getCachedLeague()
  const name = user?.displayName || user?.name || 'Alex Chen'
  const visibleLinks = clubhouseOnly || !league ? links.slice(0, 1) : links

  return (
    <aside className="app-sidebar">
      <a className="app-sidebar__brand" href="/overview" aria-label="Locked In dashboard">
        <span aria-hidden>ϟ</span> LOCKED IN
      </a>

      <p className="app-sidebar__label">YOUR CLUBHOUSE</p>
      <nav className="app-sidebar__nav" aria-label="Main navigation">
        {visibleLinks.map((link, index) => (
          <div key={link.id}>
            {index === 1 && <p className="app-sidebar__label app-sidebar__league">{(league?.name || 'YOUR LEAGUE').toUpperCase()}</p>}
            <a
              className={active === link.id ? 'app-sidebar__link app-sidebar__link--active' : 'app-sidebar__link'}
              href={link.href}
              aria-current={active === link.id ? 'page' : undefined}
            >
              <span aria-hidden>{link.icon}</span>{link.label}
            </a>
          </div>
        ))}
      </nav>

      <a className="app-sidebar__profile" href="/profile" aria-current={active === 'profile' ? 'page' : undefined}>
        <span className="app-sidebar__avatar">{user?.photoUrl ? <img src={resolveImageUrl(user.photoUrl)} alt="" /> : initials(name)}</span>
        <span><strong>{name}</strong><small>{user?.school || 'View your profile'}</small></span>
      </a>
    </aside>
  )
}
