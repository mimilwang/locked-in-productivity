import { cachedUser } from '../services/authService'
import { getCachedLeague } from '../services/leagueService'
import './AppSidebar.css'
import { resolveImageUrl } from '../services/imageService'
import potatoLogo from '../assets/potato-logo.jpg'

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
  const mobilePrimaryIds: SidebarPage[] = ['leagues', 'dashboard', 'activity', 'feed']
  const mobilePrimaryLinks = visibleLinks.filter((link) => mobilePrimaryIds.includes(link.id))
  const mobileMoreLinks = visibleLinks.filter((link) => !mobilePrimaryIds.includes(link.id))

  return (
    <>
      <aside className="app-sidebar">
        <a className="app-sidebar__brand" href="/overview" aria-label="Locked In dashboard">
          <img src={potatoLogo} alt="" aria-hidden />
          <span>LOCKED IN</span>
        </a>

        <p className="app-sidebar__label">YOUR CLUBHOUSE</p>
        <nav className="app-sidebar__nav" aria-label="Main navigation">
          {visibleLinks.map((link, index) => (
            <div key={link.id}>
              {index === 1 && <p className="app-sidebar__label app-sidebar__league">{(league?.name || 'YOUR LEAGUE').toUpperCase()}</p>}
              <a className={active === link.id ? 'app-sidebar__link app-sidebar__link--active' : 'app-sidebar__link'} href={link.href} aria-current={active === link.id ? 'page' : undefined}>
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

      <header className="app-mobile-header">
        <a className="app-mobile-header__brand" href="/overview">
          <img src={potatoLogo} alt="" /><strong>LOCKED IN</strong>
        </a>
        <a className="app-mobile-header__profile" href="/profile" aria-label={`Open ${name}'s profile`}>
          {user?.photoUrl ? <img src={resolveImageUrl(user.photoUrl)} alt="" /> : initials(name)}
        </a>
      </header>

      <nav className="app-mobile-nav" aria-label="Mobile navigation">
        {mobilePrimaryLinks.map((link) => (
          <a key={link.id} className={active === link.id ? 'app-mobile-nav__link app-mobile-nav__link--active' : 'app-mobile-nav__link'} href={link.href} aria-current={active === link.id ? 'page' : undefined}>
            <span aria-hidden>{link.icon}</span><small>{link.id === 'activity' ? 'Log' : link.label.replace('Your ', '')}</small>
          </a>
        ))}
        <details className="app-mobile-more">
          <summary className={mobileMoreLinks.some((link) => link.id === active) || active === 'profile' ? 'app-mobile-nav__link app-mobile-nav__link--active' : 'app-mobile-nav__link'}>
            <span aria-hidden>•••</span><small>More</small>
          </summary>
          <div className="app-mobile-more__menu">
            {mobileMoreLinks.map((link) => <a key={link.id} href={link.href}><span aria-hidden>{link.icon}</span>{link.label}</a>)}
            <a href="/profile"><span aria-hidden>●</span>Profile</a>
          </div>
        </details>
      </nav>
    </>
  )
}
