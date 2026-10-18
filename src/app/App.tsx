import AuthPage from '../pages/AuthPage'
import CreateLeague from '../pages/CreateLeague'
import DailyChallengesPage from '../pages/DailyChallengesPage'
import Leaderboard from '../pages/Leaderboard'
import LeagueHomePage from '../pages/LeagueHomePage'
import LiveFeedPage from '../pages/LiveFeedPage'
import MonthlyReveal from '../pages/Monthlyreveal'
import ProfilePage from '../pages/ProfilePage'
import TimerPage from '../pages/TimerPage'
import { isAuthenticated } from '../services/authService'

function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  const publicRoute = path === '/login' || path === '/signup'

  if (!isAuthenticated() && !publicRoute) {
    window.location.replace('/login')
    return null
  }

  if (isAuthenticated() && (path === '/' || publicRoute)) {
    window.location.replace('/overview')
    return null
  }

  switch (path) {
    case '/login': return <AuthPage mode="login" />
    case '/signup': return <AuthPage mode="signup" />
    case '/overview': return <LeagueHomePage />
    case '/timer': return <TimerPage />
    case '/leaderboard': return <Leaderboard />
    case '/monthly-awards': return <MonthlyReveal />
    case '/daily-challenges': return <DailyChallengesPage />
    case '/feed': return <LiveFeedPage />
    case '/create-league': return <CreateLeague />
    case '/profile': return <ProfilePage />
    default: return <NotFound />
  }
}

function NotFound() {
  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f4ec', color: '#17231b', fontFamily: 'system-ui' }}><div><h1>Page not found.</h1><a href="/overview">Return to overview →</a></div></main>
}

export default App
