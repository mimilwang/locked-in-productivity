import type { Challenge } from '../types/challenges'

/** Fun-sized: quick, casual boosts (~10–25 pts) */
export const FUN_CHALLENGES: Challenge[] = [
  {
    id: 'fun-walk-buddy',
    title: 'Buddy walk',
    description:
      'Take a 15-minute walk with another league member — outdoors or around campus.',
    size: 'fun',
    points: 15,
    category: 'activity',
    requiresBuddy: true,
  },
  {
    id: 'fun-journal-15',
    title: 'Quick journal',
    description: 'Journal for 15 minutes about how your week is going.',
    size: 'fun',
    points: 15,
    category: 'mindfulness',
    requiresBuddy: false,
  },
  {
    id: 'fun-water-check',
    title: 'Hydration check-in',
    description:
      'Drink a full bottle of water and send a hydration selfie or note to the league chat.',
    size: 'fun',
    points: 10,
    category: 'wellness',
    requiresBuddy: false,
  },
  {
    id: 'fun-gratitude-text',
    title: 'Gratitude shoutout',
    description:
      'Text another league member one thing you appreciate about them.',
    size: 'fun',
    points: 15,
    category: 'social',
    requiresBuddy: true,
  },
  {
    id: 'fun-stretch-break',
    title: 'Stretch break',
    description:
      'Do a 10-minute stretch or mobility session (solo or with a buddy).',
    size: 'fun',
    points: 15,
    category: 'wellness',
    requiresBuddy: false,
  },
  {
    id: 'fun-no-scroll',
    title: 'Phone-free half hour',
    description:
      'Go 30 minutes without social media. Optionally do it alongside a league member.',
    size: 'fun',
    points: 20,
    category: 'mindfulness',
    requiresBuddy: false,
  },
  {
    id: 'fun-study-sync',
    title: 'Study sync',
    description:
      'Co-work or study with another league member for 25 minutes (Pomodoro style).',
    size: 'fun',
    points: 20,
    category: 'social',
    requiresBuddy: true,
  },
  {
    id: 'fun-healthy-snack',
    title: 'Fuel up',
    description:
      'Prep or share a healthy snack and tell the league what you made.',
    size: 'fun',
    points: 15,
    category: 'wellness',
    requiresBuddy: false,
  },
]

/** Party-sized: bigger community / wellbeing lifts (~40–75 pts) */
export const PARTY_CHALLENGES: Challenge[] = [
  {
    id: 'party-buddy-workout',
    title: 'Buddy workout',
    description:
      'Complete a workout with another league member — gym, run, yoga, or home session.',
    size: 'party',
    points: 50,
    category: 'activity',
    requiresBuddy: true,
  },
  {
    id: 'party-host-dinner',
    title: 'Host a dinner',
    description:
      'Host a meal for 2+ league members (home-cooked, takeout night, or dining hall hang).',
    size: 'party',
    points: 75,
    category: 'social',
    requiresBuddy: true,
  },
  {
    id: 'party-group-walk',
    title: 'League stroll',
    description: 'Go for a walk or hike with at least two other league members.',
    size: 'party',
    points: 55,
    category: 'activity',
    requiresBuddy: true,
  },
  {
    id: 'party-cook-together',
    title: 'Cook together',
    description:
      'Cook or meal-prep with another league member for at least 45 minutes.',
    size: 'party',
    points: 60,
    category: 'social',
    requiresBuddy: true,
  },
  {
    id: 'party-digital-detox',
    title: 'Evening digital detox',
    description:
      'Spend 2 hours screen-free after 6pm. Invite a league buddy to join you offline.',
    size: 'party',
    points: 45,
    category: 'mindfulness',
    requiresBuddy: false,
  },
  {
    id: 'party-volunteer-act',
    title: 'Pay it forward',
    description:
      'Do a small act of service together (help a friend move, clean a shared space, campus volunteer hour).',
    size: 'party',
    points: 65,
    category: 'social',
    requiresBuddy: true,
  },
  {
    id: 'party-game-night',
    title: 'Low-stakes game night',
    description:
      'Host or join a game night with 2+ league members for at least an hour.',
    size: 'party',
    points: 50,
    category: 'social',
    requiresBuddy: true,
  },
  {
    id: 'party-morning-reset',
    title: 'Morning reset club',
    description:
      'Start the day with another member: sunrise walk, coffee + planning, or a short workout before noon.',
    size: 'party',
    points: 55,
    category: 'wellness',
    requiresBuddy: true,
  },
]
