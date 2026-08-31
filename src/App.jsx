import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const WEEKDAYS = [
  { id: 1, short: 'Pon' },
  { id: 2, short: 'Wt' },
  { id: 3, short: 'Śr' },
  { id: 4, short: 'Czw' },
  { id: 5, short: 'Pt' },
  { id: 6, short: 'Sob' },
  { id: 0, short: 'Nd' },
]

const defaultDays = [0, 1, 2, 3, 4, 5, 6]

const CATEGORIES = ['YouTube', 'Zdrowie', 'Sport', 'Nauka', 'Praca', 'Inne']

const XP_PER_TASK_DEFAULT = 25
const IMPORTANT_BONUS_XP = 100
const IMPORTANT_TASKS_FOR_BONUS = 5
const XP_DATA_VERSION = 4

// Około 10 idealnych dni = jedna nowa ranga:
// 5 ważnych zadań × 25 XP + 100 XP bonusu = 225 XP / dzień.
const RANKS = [
  { minXp: 0, name: 'Początkujący', emoji: '🥚' },
  { minXp: 2250, name: 'Nowicjusz', emoji: '🌱' },
  { minXp: 4500, name: 'Średniak', emoji: '🧠' },
  { minXp: 6750, name: 'Prawie Sigma', emoji: '😈' },
  { minXp: 9000, name: 'Sigma', emoji: '🗿' },
  { minXp: 11250, name: 'GOAT', emoji: '🐐' },
  { minXp: 13500, name: 'Sigma nad GOATami', emoji: '👑' },
]


const BADGES = [
  { id: 'first', emoji: '🌱', name: 'Pierwszy krok', description: 'Ukończ pierwsze zadanie.', check: ({ totalCompletedTasks }) => totalCompletedTasks >= 1 },
  { id: 'streak7', emoji: '🔥', name: 'Tydzień ognia', description: 'Zrób 7 dni streak.', check: ({ currentStreak }) => currentStreak >= 7 },
  { id: 'perfect', emoji: '💯', name: 'Perfekcjonista', description: 'Ukończ wszystkie zaplanowane zadania w jednym dniu.', check: ({ perfectDayCount }) => perfectDayCount >= 1 },
  { id: 'xp1000', emoji: '⚡', name: '1000 XP', description: 'Zdobądź co najmniej 1000 XP.', check: ({ totalXp }) => totalXp >= 1000 },
  { id: 'short50', emoji: '🎬', name: 'Content Machine', description: 'Nagraj łącznie 50 shortów.', check: ({ totalShorts }) => totalShorts >= 50 },
  { id: 'live50', emoji: '🔴', name: 'Live Machine', description: 'Zrób łącznie 50 live.', check: ({ totalLives }) => totalLives >= 50 },
  { id: 'sigma', emoji: '🗿', name: 'Sigma', description: 'Osiągnij rangę Sigma.', check: ({ totalXp }) => totalXp >= 9000 },
  { id: 'goat', emoji: '🐐', name: 'GOAT', description: 'Osiągnij rangę GOAT.', check: ({ totalXp }) => totalXp >= 11250 },
  { id: 'ultra', emoji: '👑', name: 'Sigma nad GOATami', description: 'Osiągnij najwyższą rangę.', check: ({ totalXp }) => totalXp >= 13500 },
]



const INITIAL_GOALS = [
  {
    id: 1,
    title: '1000 subów na YouTube',
    emoji: '🏆',
    current: 0,
    target: 1000,
    unit: 'subów',
    category: 'YouTube',
    important: true,
  },
  {
    id: 2,
    title: '500 shortów',
    emoji: '🎬',
    current: 0,
    target: 500,
    unit: 'shortów',
    category: 'YouTube',
    important: false,
  },
  {
    id: 3,
    title: '10 000 zł',
    emoji: '💰',
    current: 0,
    target: 10000,
    unit: 'zł',
    category: 'Inne',
    important: false,
  },
]

const WEEKLY_CHALLENGES = [
  { id: 'shorts-week', taskTitle: 'Shorty', emoji: '🎬', name: 'Content Rush', description: 'Nagraj 15 shortów w tym tygodniu.', target: 15, unit: 'shortów', type: 'counter', xp: 300 },
  { id: 'lives-week', taskTitle: 'Live', emoji: '🔴', name: 'Live Machine', description: 'Zrób 6 live w tym tygodniu.', target: 6, unit: 'live', type: 'counter', xp: 300 },
  { id: 'gym-week', taskTitle: 'Siłownia', emoji: '🏋️', name: '3 treningi', description: 'Zrób 3 treningi w tym tygodniu.', target: 3, unit: 'treningi', type: 'checkbox', xp: 300 },
  { id: 'calories-week', taskTitle: 'Kalorie', emoji: '🍽️', name: '21K kcal', description: 'Zjedz łącznie 21 000 kcal w tym tygodniu.', target: 21000, unit: 'kcal', type: 'counter', xp: 300 },
]

function getWeekStartKey(date = new Date()) {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  return getDateKey(start)
}

const initialTasks = [
  {
    id: 1,
    title: 'Shorty',
    description: 'Nagraj 5 shortów',
    category: 'YouTube',
    emoji: '🎬',
    type: 'counter',
    minimumTarget: 3,
    target: 5,
    bonusTarget: 5,
    minimumXp: 0,
    unit: 'shortów',
    step: 1,
    value: 0,
    xp: 25,
    important: true,
    days: defaultDays,
  },
  {
    id: 2,
    title: 'Siłownia',
    description: 'Idź na trening',
    category: 'Sport',
    emoji: '🏋️',
    type: 'checkbox',
    value: 0,
    xp: 25,
    important: true,
    days: defaultDays,
  },
  {
    id: 3,
    title: 'Live',
    description: 'Zrób minimum 2 live',
    category: 'YouTube',
    emoji: '🔴',
    type: 'counter',
    minimumTarget: 1,
    target: 2,
    bonusTarget: 3,
    minimumXp: 10,
    unit: 'live',
    step: 1,
    value: 0,
    xp: 25,
    important: true,
    days: defaultDays,
  },
  {
    id: 4,
    title: 'Kalorie',
    description: 'Zjedz minimum 3000 kcal',
    category: 'Zdrowie',
    emoji: '🍽️',
    type: 'counter',
    minimumTarget: 2500,
    target: 3000,
    bonusTarget: 3500,
    minimumXp: 10,
    unit: 'kcal',
    step: 100,
    value: 0,
    xp: 25,
    important: true,
    days: defaultDays,
  },
]

function getDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDateLabel(dateKey) {
  const [year, month, day] = dateKey.split('-')
  const date = new Date(year, month - 1, day)

  const dayNames = [
    'Niedziela',
    'Poniedziałek',
    'Wtorek',
    'Środa',
    'Czwartek',
    'Piątek',
    'Sobota',
  ]

  const monthNames = [
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
  ]

  return `${dayNames[date.getDay()]}, ${day} ${monthNames[date.getMonth()]} ${year}`
}

function getDayOfWeek(date = new Date()) {
  return date.getDay()
}

function safeParseJson(value, fallback = null) {
  if (value == null || value === '') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function safeGetJson(key, fallback = null) {
  try {
    return safeParseJson(localStorage.getItem(key), fallback)
  } catch {
    return fallback
  }
}

function safeSetJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage może być niedostępny albo pełny. Aplikacja nadal działa w pamięci.
  }
}

function normalizeTask(task = {}) {
  const isCheckbox = task.type === 'checkbox'
  const target = Math.max(1, Number(task.target) || 1)
  const minimumTarget = isCheckbox
    ? 1
    : Math.max(1, Math.min(target, Number(task.minimumTarget) || 1))
  const bonusTarget = isCheckbox
    ? 1
    : Math.max(target, Number(task.bonusTarget) || target)
  const xp = Math.max(5, Number(task.xp) || 25)
  const minimumXp = isCheckbox
    ? xp
    : Math.max(0, Math.min(xp, Number.isFinite(Number(task.minimumXp)) ? Number(task.minimumXp) : 10))
  const bonusXp = isCheckbox
    ? xp
    : Math.max(xp, Number(task.bonusXp) || Math.max(xp, 50))

  return {
    ...task,
    category: task.category === 'Tworzenie' ? 'YouTube' : task.category || 'Inne',
    days: Array.isArray(task.days) && task.days.length ? task.days : [...defaultDays],
    value: Number(task.value) || 0,
    minimumTarget,
    target,
    bonusTarget,
    minimumXp,
    xp,
    bonusXp,
    important: typeof task.important === 'boolean' ? task.important : true,
  }
}

function normalizeXpDay(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== XP_DATA_VERSION) {
    return {
      version: XP_DATA_VERSION,
      rewardsByTask: {},
      taskXp: 0,
      bonusXp: 0,
      importantBonusClaimed: false,
    }
  }

  return {
    version: XP_DATA_VERSION,
    rewardsByTask: value.rewardsByTask && typeof value.rewardsByTask === 'object' ? value.rewardsByTask : {},
    taskXp: Number(value.taskXp) || 0,
    bonusXp: Number(value.bonusXp) || 0,
    importantBonusClaimed: Boolean(value.importantBonusClaimed),
  }
}


function isTaskCompleted(task) {
  if (task.type === 'checkbox') return task.value === 1
  return task.value >= task.target
}

function calculateProgress(tasks) {
  if (!tasks.length) return { completed: 0, total: 0, percentage: 0 }

  const completed = tasks.filter(isTaskCompleted).length

  return {
    completed,
    total: tasks.length,
    percentage: Math.round((completed / tasks.length) * 100),
  }
}

function getRank(totalXp) {
  let rank = RANKS[0]

  for (const item of RANKS) {
    if (totalXp >= item.minXp) rank = item
  }

  return rank
}

function getNextRank(totalXp) {
  return RANKS.find((rank) => rank.minXp > totalXp) || null
}

function getLevel(totalXp) {
  return Math.floor(totalXp / 250) + 1
}

function getLevelProgress(totalXp) {
  const level = getLevel(totalXp)
  const currentLevelXp = (level - 1) * 250
  const nextLevelXp = level * 250
  const progressXp = Math.max(0, totalXp - currentLevelXp)
  const neededXp = Math.max(0, nextLevelXp - currentLevelXp)
  const percentage = neededXp === 0
    ? 100
    : Math.min(100, Math.round((progressXp / neededXp) * 100))

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progressXp,
    neededXp,
    percentage,
  }
}

function App() {
  // Data jest stanem, żeby aplikacja sama przeszła na nowy dzień
  // nawet jeśli pozostaje otwarta przez całą noc.
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const today = currentDate
  const todayKey = getDateKey(today)
  const todayDay = getDayOfWeek(today)
  const storageKey = `daily-tasks-${todayKey}`

  const [taskDefinitions, setTaskDefinitions] = useState(() => {
    const savedDefinitions = safeGetJson('task-definitions', null)

    if (Array.isArray(savedDefinitions)) {
      return savedDefinitions.map(normalizeTask)
    }

    const oldDaily = safeGetJson(storageKey, null)

    if (Array.isArray(oldDaily)) {
      const migrated = oldDaily.map(normalizeTask)
      safeSetJson('task-definitions', migrated)
      return migrated
    }

    const normalizedInitialTasks = initialTasks.map(normalizeTask)
    safeSetJson('task-definitions', normalizedInitialTasks)
    return normalizedInitialTasks
  })

  const getTasksForToday = (definitions, savedTasks = null) => {
    const savedMap = new Map(
      (Array.isArray(savedTasks) ? savedTasks : [])
        .filter((task) => task && typeof task === 'object')
        .map((task) => [task.id, normalizeTask(task)])
    )

    return definitions
      .filter((task) => task.days.includes(todayDay))
      .map((task) => {
        const saved = savedMap.get(task.id)
        return saved ? { ...task, value: saved.value } : { ...task, value: 0 }
      })
  }

  const [tasks, setTasks] = useState(() => {
    const savedTasks = safeGetJson(storageKey, null)
    return getTasksForToday(taskDefinitions, Array.isArray(savedTasks) ? savedTasks : null)
  })

  const [history, setHistory] = useState(() => {
    const saved = safeGetJson('daily-history', {})
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
  })

  const [xpData, setXpData] = useState(() => {
    return normalizeXpDay(safeGetJson(`daily-xp-${todayKey}`, null))
  })

  const [weeklyBonusClaimed, setWeeklyBonusClaimed] = useState(() => {
    const weekKey = getWeekStartKey()
    return localStorage.getItem(`weekly-bonus-${weekKey}`) === 'claimed'
  })

  const [activePage, setActivePage] = useState('today')
  const [uiScale, setUiScale] = useState(() => {
    try {
      const saved = localStorage.getItem('ui-scale')
      return ['small', 'medium', 'large'].includes(saved) ? saved : 'medium'
    } catch {
      return 'medium'
    }
  })
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState(null)

  const emptyTaskForm = {
    title: '',
    description: '',
    category: 'YouTube',
    emoji: '🎯',
    type: 'checkbox',
    minimumTarget: 1,
    target: 3,
    bonusTarget: 5,
    unit: 'razy',
    step: 1,
    minimumXp: 10,
    xp: 25,
    bonusXp: 50,
    important: true,
    days: [...defaultDays],
  }

  const [taskForm, setTaskForm] = useState(emptyTaskForm)

  const [goals, setGoals] = useState(() => {
    const saved = safeGetJson('long-term-goals', null)
    return Array.isArray(saved) ? saved : INITIAL_GOALS
  })

  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState(null)
  const emptyGoalForm = {
    title: '',
    emoji: '🎯',
    current: 0,
    target: 100,
    unit: 'punktów',
    category: 'Inne',
    important: true,
  }
  const [goalForm, setGoalForm] = useState(emptyGoalForm)
  const [backupMessage, setBackupMessage] = useState('')

  const [rewardQueue, setRewardQueue] = useState([])
  const [activeReward, setActiveReward] = useState(null)
  const [confetti, setConfetti] = useState([])

  useEffect(() => {
    try {
      localStorage.setItem('ui-scale', uiScale)
    } catch {}
  }, [uiScale])


  useEffect(() => {
    setTaskDefinitions((current) => {
      let changed = false
      const migrated = current.map((task) => {
        if (task.id === 1 && task.title === 'Shorty' && task.type === 'counter' && task.target < 5) {
          changed = true
          return normalizeTask({
            ...task,
            description: 'Nagraj 5 shortów',
            minimumTarget: 3,
            target: 5,
            bonusTarget: 5,
            minimumXp: 0,
          })
        }
        return normalizeTask(task)
      })
      return changed ? migrated : current
    })
  }, [])

  useEffect(() => {
    if (activeReward || rewardQueue.length === 0) return

    const [nextReward, ...rest] = rewardQueue
    setRewardQueue(rest)

    const pieces = Array.from({ length: 70 }, (_, index) => ({
      id: `${Date.now()}-${index}`,
      left: 8 + Math.random() * 84,
      delay: Math.random() * 0.2,
      drift: Math.round(Math.random() * 320 - 160),
      rotation: Math.round(Math.random() * 720 - 360),
      size: Math.round(7 + Math.random() * 8),
      duration: (1.25 + Math.random() * 0.7).toFixed(2),
    }))

    setConfetti(pieces)
    setActiveReward(nextReward)

    const timeout = window.setTimeout(() => {
      setActiveReward(null)
      setConfetti([])
    }, 1900)

    return () => window.clearTimeout(timeout)
  }, [rewardQueue, activeReward])

  // Wykrywa zmianę dnia bez ręcznego odświeżania aplikacji.
  useEffect(() => {
    const checkDate = () => {
      const nextDate = new Date()
      if (getDateKey(nextDate) !== todayKey) {
        setCurrentDate(nextDate)
      }
    }

    const interval = window.setInterval(checkDate, 30 * 1000)
    const timeout = window.setTimeout(checkDate, 1000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [todayKey])

  const initializedDateRef = useRef(todayKey)

  useEffect(() => {
    if (initializedDateRef.current === todayKey) return

    initializedDateRef.current = todayKey

    const savedTasks = safeGetJson(`daily-tasks-${todayKey}`, null)
    const freshTasks = getTasksForToday(
      taskDefinitions,
      Array.isArray(savedTasks) ? savedTasks : null,
    )

    setTasks(freshTasks)
    setXpData(normalizeXpDay(safeGetJson(`daily-xp-${todayKey}`, null)))

    const weekKey = getWeekStartKey(today)
    try {
      setWeeklyBonusClaimed(localStorage.getItem(`weekly-bonus-${weekKey}`) === 'claimed')
    } catch {
      setWeeklyBonusClaimed(false)
    }

    setRewardQueue([])
    setActiveReward(null)
    setConfetti([])
  }, [todayKey, todayDay, taskDefinitions])

  useEffect(() => {
    safeSetJson('task-definitions', taskDefinitions)
  }, [taskDefinitions])

  useEffect(() => {
    safeSetJson('long-term-goals', goals)
  }, [goals])

  useEffect(() => {
    safeSetJson(storageKey, tasks)
    safeSetJson(`daily-xp-${todayKey}`, xpData)

    setHistory((currentHistory) => {
      const updatedHistory = { ...currentHistory, [todayKey]: tasks }
      safeSetJson('daily-history', updatedHistory)
      return updatedHistory
    })
  }, [tasks, storageKey, todayKey, xpData])

  const progress = calculateProgress(tasks)
  const importantTasksToday = tasks.filter((task) => task.important)
  const completedImportantTasks = importantTasksToday.filter(isTaskCompleted).length
  const importantBonusEarned = xpData.bonusXp >= IMPORTANT_BONUS_XP
  const dayCompleted = progress.total > 0 && progress.percentage === 100

  const allHistory = useMemo(
    () => ({ ...history, [todayKey]: tasks }),
    [history, tasks, todayKey]
  )

  const historyDates = Object.keys(allHistory).sort()

  const completedDays = historyDates.filter((dateKey) => {
    const dayTasks = allHistory[dateKey] || []
    const dayProgress = calculateProgress(dayTasks)
    return dayProgress.total > 0 && dayProgress.percentage === 100
  }).length

  const totalCompletedTasks = historyDates.reduce(
    (total, dateKey) => total + calculateProgress(allHistory[dateKey] || []).completed,
    0
  )

  const overallPossible = historyDates.reduce(
    (total, dateKey) => total + calculateProgress(allHistory[dateKey] || []).total,
    0
  )

  const overallPercentage = overallPossible
    ? Math.round((totalCompletedTasks / overallPossible) * 100)
    : 0

  const totalXp = historyDates.reduce((total, dateKey) => {
    if (dateKey === todayKey) {
      return total + xpData.taskXp + xpData.bonusXp
    }

    const savedXp = normalizeXpDay(safeGetJson(`daily-xp-${dateKey}`, null))

    if (savedXp.taskXp || savedXp.bonusXp) {
      return total + savedXp.taskXp + savedXp.bonusXp
    }

    return total + 0
  }, 0)

  const currentStreak = useMemo(() => {
    let streak = 0
    const date = new Date()

    while (true) {
      const key = getDateKey(date)
      const dayTasks = allHistory[key]
      if (!dayTasks) break

      const dayProgress = calculateProgress(dayTasks)
      if (dayProgress.total === 0 || dayProgress.percentage < 100) break

      streak += 1
      date.setDate(date.getDate() - 1)
    }

    return streak
  }, [allHistory])

  const rank = getRank(totalXp)
  const nextRank = getNextRank(totalXp)
  const rankProgress = nextRank
    ? Math.min(100, Math.round(((totalXp - rank.minXp) / (nextRank.minXp - rank.minXp)) * 100))
    : 100

  const levelInfo = getLevelProgress(totalXp)

  const categoryProgress = CATEGORIES.map((category) => {
    const categoryTasks = historyDates.flatMap((dateKey) => (
      (allHistory[dateKey] || []).filter((task) => task.category === category)
    ))

    const completed = categoryTasks.filter(isTaskCompleted).length
    const total = categoryTasks.length
    const percentage = total ? Math.round((completed / total) * 100) : 0

    return { category, completed, total, percentage }
  }).filter((item) => item.total > 0)

  const strongestCategories = [...categoryProgress]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3)

  const perfectDayCount = historyDates.filter((dateKey) => {
    const dayTasks = allHistory[dateKey] || []
    const dayProgress = calculateProgress(dayTasks)
    return dayProgress.total > 0 && dayProgress.percentage === 100
  }).length

  const totalShorts = historyDates.reduce((sum, dateKey) => (
    sum + (allHistory[dateKey] || [])
      .filter((task) => task.title === 'Shorty')
      .reduce((inner, task) => inner + (Number(task.value) || 0), 0)
  ), 0)

  const totalLives = historyDates.reduce((sum, dateKey) => (
    sum + (allHistory[dateKey] || [])
      .filter((task) => task.title === 'Live')
      .reduce((inner, task) => inner + (Number(task.value) || 0), 0)
  ), 0)

  const badgeContext = {
    totalCompletedTasks: totalCompletedTasks,
    currentStreak,
    perfectDayCount,
    totalXp,
    totalShorts,
    totalLives,
  }

  const unlockedBadges = BADGES.filter((badge) => badge.check(badgeContext)).length


  const currentWeekStart = useMemo(() => {
    const date = new Date()
    const day = date.getDay()
    const diff = day === 0 ? -6 : 1 - day
    date.setDate(date.getDate() + diff)
    return date
  }, [])

  const weekDateKeys = useMemo(() => (
    Array.from({ length: 7 }, (_, index) => {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + index)
      return getDateKey(date)
    })
  ), [currentWeekStart])

  const getWeeklyChallengeValue = (challenge) => {
    return weekDateKeys.reduce((total, dateKey) => {
      const dayTasks = allHistory[dateKey] || []
      return total + dayTasks.reduce((sum, task) => {
        if (task.title !== challenge.taskTitle) return sum
        if (challenge.type === 'checkbox') return sum + (isTaskCompleted(task) ? 1 : 0)
        return sum + (Number(task.value) || 0)
      }, 0)
    }, 0)
  }

  const weeklyChallenges = WEEKLY_CHALLENGES.map((challenge) => {
    const value = getWeeklyChallengeValue(challenge)
    const percentage = Math.min(100, Math.round((value / challenge.target) * 100))
    return { ...challenge, value, percentage, completed: value >= challenge.target }
  })

  const weeklyCompletedCount = weeklyChallenges.filter((challenge) => challenge.completed).length
  const weeklyAllComplete = weeklyChallenges.length > 0 && weeklyCompletedCount === weeklyChallenges.length
  const weeklyBonusXp = WEEKLY_CHALLENGES.reduce((sum, challenge) => sum + challenge.xp, 0)

  const claimWeeklyBonus = () => {
    if (!weeklyAllComplete || weeklyBonusClaimed) return
    setXpData((current) => ({
      ...current,
      version: XP_DATA_VERSION,
      bonusXp: current.bonusXp + weeklyBonusXp,
    }))
    const weekKey = getWeekStartKey()
    try {
      localStorage.setItem(`weekly-bonus-${weekKey}`, 'claimed')
    } catch {}
    setWeeklyBonusClaimed(true)
    queueReward(weeklyBonusXp, 'Tygodniowe wyzwania ukończone!')
  }

  const openAddTask = () => {
    setEditingTaskId(null)
    setTaskForm({ ...emptyTaskForm, days: [...defaultDays] })
    setShowTaskModal(true)
  }

  const openEditTask = (task) => {
    setEditingTaskId(task.id)
    setTaskForm({
      ...emptyTaskForm,
      ...normalizeTask(task),
      days: Array.isArray(task.days) && task.days.length ? [...task.days] : [...defaultDays],
    })
    setShowTaskModal(true)
  }

  const closeTaskModal = () => {
    setShowTaskModal(false)
    setEditingTaskId(null)
    setTaskForm({ ...emptyTaskForm, days: [...defaultDays] })
  }

  const toggleFormDay = (dayId) => {
    setTaskForm((current) => {
      const exists = current.days.includes(dayId)
      if (exists && current.days.length === 1) return current

      return {
        ...current,
        days: exists
          ? current.days.filter((day) => day !== dayId)
          : [...current.days, dayId],
      }
    })
  }

  const saveTaskDefinition = () => {
    if (!taskForm.title.trim()) return

    const savedTask = normalizeTask({
      ...taskForm,
      id: editingTaskId ?? Date.now(),
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || 'Twoje własne zadanie',
      minimumTarget: taskForm.type === 'counter' ? Number(taskForm.minimumTarget) || 1 : 1,
      target: taskForm.type === 'counter' ? Number(taskForm.target) || 1 : 1,
      bonusTarget: taskForm.type === 'counter' ? Number(taskForm.bonusTarget) || Number(taskForm.target) || 1 : 1,
      unit: taskForm.type === 'counter' ? taskForm.unit || 'razy' : undefined,
      step: taskForm.type === 'counter' ? Number(taskForm.step) || 1 : undefined,
      minimumXp: taskForm.type === 'counter' ? Math.max(1, Number(taskForm.minimumXp) || 10) : Math.max(5, Number(taskForm.xp) || 25),
      xp: Math.max(5, Number(taskForm.xp) || 25),
      bonusXp: taskForm.type === 'counter' ? Math.max(Number(taskForm.xp) || 25, Number(taskForm.bonusXp) || 50) : Math.max(5, Number(taskForm.xp) || 25),
      important: Boolean(taskForm.important),
      value: 0,
      days: taskForm.days.length ? taskForm.days : [...defaultDays],
    })

    setTaskDefinitions((current) => {
      if (editingTaskId === null) return [...current, savedTask]
      return current.map((task) => (task.id === editingTaskId ? savedTask : task))
    })

    setTasks((current) => {
      if (!savedTask.days.includes(todayDay)) {
        return current.filter((task) => task.id !== savedTask.id)
      }

      const oldTask = current.find((task) => task.id === savedTask.id)
      if (oldTask) {
        return current.map((task) => task.id === savedTask.id ? { ...savedTask, value: oldTask.value } : task)
      }

      return [...current, savedTask]
    })

    closeTaskModal()
  }

  const deleteTask = (id) => {
    if (!window.confirm('Usunąć to zadanie?')) return
    setTaskDefinitions((current) => current.filter((task) => task.id !== id))
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  const toggleImportant = (id) => {
    setTaskDefinitions((current) => current.map((task) => (
      task.id === id ? { ...task, important: !task.important } : task
    )))
    setTasks((current) => current.map((task) => (
      task.id === id ? { ...task, important: !task.important } : task
    )))
  }

  const openAddGoal = () => {
    setEditingGoalId(null)
    setGoalForm({ ...emptyGoalForm })
    setShowGoalModal(true)
  }

  const openEditGoal = (goal) => {
    setEditingGoalId(goal.id)
    setGoalForm({ ...emptyGoalForm, ...goal })
    setShowGoalModal(true)
  }

  const closeGoalModal = () => {
    setShowGoalModal(false)
    setEditingGoalId(null)
    setGoalForm({ ...emptyGoalForm })
  }

  const saveGoal = () => {
    if (!goalForm.title.trim()) return

    const nextGoal = {
      id: editingGoalId ?? Date.now(),
      title: goalForm.title.trim(),
      emoji: goalForm.emoji || '🎯',
      current: Math.max(0, Number(goalForm.current) || 0),
      target: Math.max(1, Number(goalForm.target) || 1),
      unit: goalForm.unit || 'punktów',
      category: goalForm.category || 'Inne',
      important: Boolean(goalForm.important),
    }

    setGoals((current) => editingGoalId
      ? current.map((goal) => goal.id === editingGoalId ? nextGoal : goal)
      : [...current, nextGoal]
    )
    closeGoalModal()
  }

  const deleteGoal = (id) => {
    setGoals((current) => current.filter((goal) => goal.id !== id))
  }

  const updateGoalValue = (id, amount) => {
    setGoals((current) => current.map((goal) => {
      if (goal.id !== id) return goal
      return { ...goal, current: Math.max(0, Math.min(goal.target, goal.current + amount)) }
    }))
  }

  const toggleGoalImportant = (id) => {
    setGoals((current) => current.map((goal) => (
      goal.id === id ? { ...goal, important: !goal.important } : goal
    )))
  }

  const queueReward = (xp, message = 'Zadanie ukończone!') => {
    setRewardQueue((current) => [...current, { xp, message }])
  }

  const getTaskTier = (task) => {
    if (task.type === 'checkbox') return isTaskCompleted(task) ? 1 : 0

    const value = Number(task.value) || 0
    if (value >= task.bonusTarget) return 3
    if (value >= task.target) return 2
    if (value >= task.minimumTarget) return 1
    return 0
  }

  const getTierReward = (task, tier) => {
    if (tier === 1) return task.minimumXp
    if (tier === 2) return Math.max(0, task.xp - task.minimumXp)
    if (tier === 3) return Math.max(0, task.bonusXp - task.xp)
    return 0
  }

  const rewardTaskProgress = (before, after) => {
    const beforeTier = getTaskTier(before)
    const afterTier = getTaskTier(after)

    if (afterTier <= beforeTier) return

    // Najważniejsze: stan nagród jest sprawdzany i zapisywany atomowo
    // w updaterze setXpData. Dzięki temu ponowne kliknięcie tego samego
    // zadania nie może przyznać XP drugi raz.
    setXpData((current) => {
      const rewardsByTask = current.rewardsByTask || {}
      const claimedTier = Number(rewardsByTask[after.id]) || 0

      // Jeśli ten poziom był już kiedyś nagrodzony, nie dawaj XP ponownie.
      if (afterTier <= claimedTier) return current

      let rewardTotal = 0
      const rewards = []

      for (let tier = claimedTier + 1; tier <= afterTier; tier += 1) {
        const reward = getTierReward(after, tier)

        if (reward > 0) {
          rewardTotal += reward
          rewards.push({
            xp: reward,
            message: tier === 1
              ? 'Minimum wykonane!'
              : tier === 2
                ? 'Cel wykonany!'
                : 'BONUS! Przekroczony cel!',
          })
        }
      }

      const nextRewards = {
        ...rewardsByTask,
        [after.id]: afterTier,
      }

      rewards.forEach((reward) => queueReward(reward.xp, reward.message))

      return {
        ...current,
        version: XP_DATA_VERSION,
        rewardsByTask: nextRewards,
        taskXp: current.taskXp + rewardTotal,
      }
    })
  }

  const awardImportantBonusIfReady = (nextTasks) => {
    const importantTasks = nextTasks.filter((task) => task.important)
    if (importantTasks.length < IMPORTANT_TASKS_FOR_BONUS) return

    const importantCompleted = importantTasks.filter(isTaskCompleted).length

    if (importantCompleted >= IMPORTANT_TASKS_FOR_BONUS) {
      setXpData((current) => {
        if (current.importantBonusClaimed) return current

        queueReward(IMPORTANT_BONUS_XP, 'PERFECT DAY! 5 najważniejszych ukończone!')

        return {
          ...current,
          version: XP_DATA_VERSION,
          bonusXp: current.bonusXp + IMPORTANT_BONUS_XP,
          importantBonusClaimed: true,
        }
      })
    }
  }

  const updateCounter = (id, amount) => {
    const before = tasks.find((task) => task.id === id)
    if (!before) return

    const step = Number(before.step) || 1
    const oldValue = Number(before.value) || 0
    const newValue = Math.max(
      0,
      Math.min(before.bonusTarget, oldValue + amount * step)
    )

    if (newValue === oldValue) return

    const after = { ...before, value: newValue }
    const nextTasks = tasks.map((task) =>
      task.id === id ? after : task
    )

    setTasks(nextTasks)

    if (amount > 0) {
      rewardTaskProgress(before, after)
    }

    awardImportantBonusIfReady(nextTasks)
  }

  const toggleCheckbox = (id) => {
    const before = tasks.find((task) => task.id === id)
    if (!before) return

    const after = {
      ...before,
      value: before.value === 1 ? 0 : 1,
    }

    const nextTasks = tasks.map((task) =>
      task.id === id ? after : task
    )

    setTasks(nextTasks)

    rewardTaskProgress(before, after)
    awardImportantBonusIfReady(nextTasks)
  }

  const importantTasks = tasks.filter((task) => task.important)
  const mainTasks = [...importantTasks, ...tasks.filter((task) => !task.important)]
    .slice(0, 5)

  const renderTaskCard = (task) => {
    const completed = isTaskCompleted(task)
    const value = Number(task.value) || 0
    const minimumReached = task.type === 'checkbox' ? completed : value >= task.minimumTarget
    const goalReached = task.type === 'checkbox' ? completed : value >= task.target
    const bonusReached = task.type === 'checkbox' ? false : value >= task.bonusTarget

    return (
      <div className={`task ${completed ? 'completed' : ''}`} key={task.id}>
        <div className="task-icon">{task.emoji}</div>

        <div className="task-content">
          <span className="task-category">{task.category}</span>
          <span className="task-title">{task.title}</span>
          <span className="task-description">{task.description}</span>

          {task.type === 'counter' ? (
            <>
              <div className="counter">
                <button className="counter-button" onClick={() => updateCounter(task.id, -1)}>−</button>
                <div className="counter-value">
                  <strong>{value}</strong>
                  <span>/ {task.bonusTarget} {task.unit}</span>
                </div>
                <button className="counter-button" onClick={() => updateCounter(task.id, 1)}>+</button>
              </div>
              <div className="task-tiers">
                <span className={minimumReached ? 'reached' : ''}>MIN {task.minimumTarget}</span>
                <span className={goalReached ? 'reached' : ''}>CEL {task.target}</span>
                <span className={bonusReached ? 'reached bonus' : ''}>BONUS {task.bonusTarget}</span>
              </div>
            </>
          ) : (
            <button className={`checkbox ${completed ? 'checked' : ''}`} onClick={() => toggleCheckbox(task.id)}>
              {completed ? '✓' : ''}
            </button>
          )}
        </div>

        <div className="task-xp-wrap">
          <div className="task-xp">+{task.xp} XP</div>
          {task.type === 'counter' && (
            <small>
              bonus +{Math.max(0, (Number(task.bonusXp) || 0) - (Number(task.xp) || 0))}
            </small>
          )}
        </div>
      </div>
    )
  }

  const renderToday = () => (
    <>
      <header className="header">
        <div>
          <p className="eyebrow">TWÓJ DZIEŃ</p>
          <h1>Dzisiaj 👋</h1>
          <p className="date">{getDateLabel(todayKey)}</p>
        </div>

        <div className="header-stats">
          <div className="mini-stat">
            <span>🔥</span>
            <strong>{currentStreak}</strong>
            <small>streak</small>
          </div>
          <div className="mini-stat">
            <span>⚡</span>
            <strong>{totalXp}</strong>
            <small>XP</small>
          </div>
        </div>
      </header>

      <section className="rank-card">
        <div className="rank-left">
          <div className="rank-icon">{rank.emoji}</div>
          <div>
            <span className="eyebrow">TWOJA RANGA</span>
            <h2>{rank.name}</h2>
            <p>{totalXp.toLocaleString('pl-PL')} XP  •  {completedDays} ukończonych dni</p>
          </div>
        </div>

        <div className="rank-progress-wrap">
          <strong>{totalXp.toLocaleString('pl-PL')} XP</strong>
          <span>{nextRank ? `${(nextRank.minXp - totalXp).toLocaleString('pl-PL')} XP do ${nextRank.name}` : 'Maksymalna ranga'}</span>
          <div className="rank-bar"><div className="rank-fill" style={{ width: `${rankProgress}%` }} /></div>
        </div>
      </section>

      <section className="progress-card">
        <div className="progress-top">
          <div>
            <span className="progress-title">Dzisiejszy progres</span>
            <strong>{progress.completed} / {progress.total}</strong>
          </div>
          <span className="percentage">{progress.percentage}%</span>
        </div>

        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress.percentage}%` }} /></div>

        <div className={dayCompleted ? 'day-complete' : 'day-status'}>
          <span className="day-status-icon">{dayCompleted ? '🔥' : '🎯'}</span>
          <div>
            <strong>{progress.total === 0 ? 'Brak zadań na dziś' : dayCompleted ? 'PERFECT DAY! 🔥' : importantTasksToday.length >= IMPORTANT_TASKS_FOR_BONUS && importantBonusEarned ? 'NAJWAŻNIEJSZE UKOŃCZONE!' : 'Jeszcze trochę i będzie komplet'}</strong>
            <span>{progress.total === 0 ? 'Dodaj zadania w Ustawieniach.' : importantTasksToday.length >= IMPORTANT_TASKS_FOR_BONUS && importantBonusEarned ? `5/5 najważniejszych. Bonus +${IMPORTANT_BONUS_XP} XP już odebrany.` : dayCompleted ? 'Wszystkie zaplanowane zadania są zrobione.' : `${completedImportantTasks}/${Math.min(IMPORTANT_TASKS_FOR_BONUS, importantTasksToday.length)} najważniejszych. ${progress.total - progress.completed} ${progress.total - progress.completed === 1 ? 'zadanie' : 'zadań'} czeka.`}</span>
          </div>
        </div>
      </section>

      <section className="bonus-card">
        <div>
          <span className="bonus-emoji">⚡</span>
          <div>
            <strong>PERFECT DAY • bonus za 5 priorytetów</strong>
            <small>{Math.min(completedImportantTasks, IMPORTANT_TASKS_FOR_BONUS)}/5 ukończonych • +{IMPORTANT_BONUS_XP} XP</small>
          </div>
        </div>
        <div className="bonus-progress"><div style={{ width: `${Math.min(100, (completedImportantTasks / IMPORTANT_TASKS_FOR_BONUS) * 100)}%` }} /></div>
      </section>

      <section className="tasks-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PRIORYTET</p>
            <h2>Najważniejsze na dziś</h2>
          </div>
          <span>{mainTasks.length}/5</span>
        </div>

        <div className="tasks">
          {mainTasks.length ? mainTasks.map(renderTaskCard) : <div className="empty-state">Dodaj swoje pierwsze zadania.</div>}
        </div>
      </section>
    </>
  )

  const renderCategoryHeader = (category) => {
    return (
      <header className="category-header">
        <div className="category-header-main">
          <p className="eyebrow">{getDateLabel(todayKey)}</p>
          <h1>{category}</h1>
          <p className="date">Dzisiejsze zadania • {progress.completed}/{progress.total} wykonane</p>
        </div>

        <div className="category-header-stats">
          <div className="mini-stat">
            <span>🔥</span>
            <strong>{currentStreak}</strong>
            <small>streak</small>
          </div>
          <div className="mini-stat">
            <span>⚡</span>
            <strong>{totalXp.toLocaleString('pl-PL')}</strong>
            <small>XP</small>
          </div>
          <div className="mini-stat">
            <span>{rank.emoji}</span>
            <strong>{rank.name}</strong>
            <small>ranga</small>
          </div>
        </div>
      </header>
    )
  }

  const categoryMeta = {
    YouTube: { emoji: '▶️', description: 'Shorty, live i cały content.' },
    Zdrowie: { emoji: '❤️', description: 'Jedzenie, sen, woda i regeneracja.' },
    Sport: { emoji: '🏋️', description: 'Siłownia, cardio i aktywność.' },
    Nauka: { emoji: '📚', description: 'Nauka, rozwój i skupienie.' },
    Praca: { emoji: '💼', description: 'Najważniejsze rzeczy do zrobienia.' },
    Inne: { emoji: '🎯', description: 'Pozostałe zadania.' },
  }

  const categoryPages = {
    YouTube: 'youtube',
    Zdrowie: 'health',
    Sport: 'sport',
    Nauka: 'category-Nauka',
    Praca: 'category-Praca',
    Inne: 'category-Inne',
  }

  const renderCategories = () => {
    return (
      <section className="categories-page">
        <div className="history-header">
          <p className="eyebrow">ORGANIZACJA</p>
          <h1>Kategorie 🗂️</h1>
          <p className="date">
            Tu znajdziesz wszystkie swoje obszary.
          </p>
        </div>

        <div className="categories-grid">
          {CATEGORIES.map((category) => {
            const meta = categoryMeta[category]
            const categoryTasks = taskDefinitions
              .filter((task) => task.category === category && task.days.includes(todayDay))
              .map((definition) => tasks.find((task) => task.id === definition.id) || { ...definition, value: 0 })

            const categoryProgress = calculateProgress(categoryTasks)

            return (
              <button
                className="category-card"
                key={category}
                onClick={() => setActivePage(categoryPages[category] || 'more')}
              >
                <div className="category-card-icon">{meta.emoji}</div>
                <div className="category-card-content">
                  <strong>{category}</strong>
                  <small>{meta.description}</small>
                  <div className="category-card-progress-row">
                    <span>{categoryProgress.completed}/{categoryProgress.total} dziś</span>
                    <b>{categoryProgress.percentage}%</b>
                  </div>
                  <div className="category-card-progress">
                    <div style={{ width: `${categoryProgress.percentage}%` }} />
                  </div>
                </div>
                <span className="category-card-arrow">›</span>
              </button>
            )
          })}
        </div>
      </section>
    )
  }

  const renderCategory = (category) => {
    const visibleTasks = taskDefinitions
      .filter((task) => task.category === category && task.days.includes(todayDay))
      .map((definition) => {
        const current = tasks.find((task) => task.id === definition.id)
        return current || { ...definition, value: 0 }
      })

    return (
      <>
        {renderCategoryHeader(category)}

        <section className="category-summary">
          <div>
            <span className="category-summary-label">PROGRES KATEGORII</span>
            <strong>{calculateProgress(visibleTasks).completed}/{calculateProgress(visibleTasks).total}</strong>
          </div>
          <div className="category-summary-bar">
            <div style={{ width: `${calculateProgress(visibleTasks).percentage}%` }} />
          </div>
          <span className="category-summary-percent">{calculateProgress(visibleTasks).percentage}%</span>
        </section>

        <div className="category-tabs">
          {CATEGORIES.map((item) => (
            <button key={item} className={category === item ? 'active' : ''} onClick={() => setActivePage(item === 'YouTube' ? 'youtube' : item === 'Zdrowie' ? 'health' : item === 'Sport' ? 'sport' : 'more')}>
              {item}
            </button>
          ))}
        </div>

        <section className="tasks-section">
          <div className="section-heading">
            <h2>Dzisiaj</h2>
            <span>{visibleTasks.length}</span>
          </div>
          <div className="tasks">
            {visibleTasks.length ? visibleTasks.map(renderTaskCard) : <div className="empty-state">Brak zadań w tej kategorii na dziś.</div>}
          </div>
        </section>
      </>
    )
  }


  const renderWeekly = () => (
    <section className="weekly-section">
      <div className="history-header">
        <p className="eyebrow">TRYB CHALLENGE</p>
        <h1>Wyzwania tygodniowe 🎯</h1>
        <p className="date">
          {getDateLabel(weekDateKeys[0])} → {getDateLabel(weekDateKeys[6])}
        </p>
      </div>

      <div className="weekly-hero">
        <div>
          <span className="eyebrow">POSTĘP TYGODNIA</span>
          <strong>{weeklyCompletedCount}/{weeklyChallenges.length}</strong>
          <p>{weeklyAllComplete ? 'Wszystkie wyzwania ukończone. 🔥' : 'Zbieraj progres każdego dnia.'}</p>
        </div>
        <div className="weekly-hero-xp">
          <span>🏆</span>
          <strong>+{weeklyBonusXp} XP</strong>
          <small>za komplet</small>
        </div>
      </div>

      <div className="weekly-list">
        {weeklyChallenges.map((challenge) => (
          <div className={`weekly-card ${challenge.completed ? 'completed' : ''}`} key={challenge.id}>
            <div className="weekly-card-top">
              <div className="weekly-icon">{challenge.emoji}</div>
              <div className="weekly-info">
                <strong>{challenge.name}</strong>
                <small>{challenge.description}</small>
              </div>
              <div className="weekly-check">{challenge.completed ? '✓' : '🎯'}</div>
            </div>

            <div className="weekly-progress-row">
              <strong>{Math.min(challenge.value, challenge.target).toLocaleString('pl-PL')}</strong>
              <span>/ {challenge.target.toLocaleString('pl-PL')} {challenge.unit}</span>
              <b>{challenge.percentage}%</b>
            </div>

            <div className="weekly-progress-bar">
              <div style={{ width: `${challenge.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>

      <button
        className={`weekly-bonus-button ${weeklyAllComplete ? 'ready' : ''}`}
        disabled={!weeklyAllComplete || weeklyBonusClaimed}
        onClick={claimWeeklyBonus}
      >
        {weeklyBonusClaimed
          ? '✓ Bonus tygodniowy odebrany'
          : weeklyAllComplete
            ? `Odbierz +${weeklyBonusXp} XP`
            : `Ukończ wszystkie wyzwania • +${weeklyBonusXp} XP`}
      </button>
    </section>
  )

  const renderHistory = () => {
    const historyDays = Object.keys(history).sort().reverse()

    return (
      <section className="history-section">
        <div className="history-header">
          <p className="eyebrow">TWOJE WYNIKI</p>
          <h1>Historia 📅</h1>
          <p className="date">Każdy dzień zostaje zapisany.</p>
        </div>

        {historyDays.length === 0 ? (
          <div className="empty-history"><span>📅</span><h2>Brak historii</h2><p>Zacznij wykonywać zadania.</p></div>
        ) : (
          <div className="history-list">
            {historyDays.map((dateKey) => {
              const dayTasks = history[dateKey] || []
              const dayProgress = calculateProgress(dayTasks)
              return (
                <div className="history-card" key={dateKey}>
                  <div className="history-card-top">
                    <div><strong>{getDateLabel(dateKey)}</strong><span>{dayProgress.completed} / {dayProgress.total} zadań</span></div>
                    <strong className="history-percentage">{dayProgress.percentage}%</strong>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${dayProgress.percentage}%` }} /></div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    )
  }

  const renderStats = () => (
    <section className="stats-section">
      <div className="history-header">
        <p className="eyebrow">TWÓJ PROGRES</p>
        <h1>Statystyki 📊</h1>
        <p className="date">Liczniki, streak i ranga.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><span>🔥</span><strong>{currentStreak}</strong><small>Aktualny streak</small></div>
        <div className="stat-card"><span>⚡</span><strong>{totalXp.toLocaleString('pl-PL')}</strong><small>XP</small></div>
        <div className="stat-card"><span>🏆</span><strong>{completedDays}</strong><small>Ukończonych dni</small></div>
        <div className="stat-card"><span>✅</span><strong>{overallPercentage}%</strong><small>Średnie wykonanie</small></div>
      </div>

      <div className="rank-card stats-rank-card">
        <div className="rank-left"><div className="rank-icon">{rank.emoji}</div><div><span className="eyebrow">RANGA</span><h2>{rank.name}</h2><p>{nextRank ? `${(nextRank.minXp - totalXp).toLocaleString('pl-PL')} XP do kolejnej rangi` : 'To najwyższa ranga.'}</p></div></div>
        <div className="rank-progress-wrap"><strong>{totalXp.toLocaleString('pl-PL')} XP</strong><span>{nextRank ? `Cel: ${nextRank.minXp.toLocaleString('pl-PL')} XP` : 'MAX'}</span><div className="rank-bar"><div className="rank-fill" style={{ width: `${rankProgress}%` }} /></div></div>
      </div>

      <div className="stats-block">
        <div className="section-heading"><h2>Ostatnie 7 dni</h2></div>
        <div className="recent-days">
          {historyDates.slice(-7).reverse().map((dateKey) => {
            const dayProgress = calculateProgress(allHistory[dateKey] || [])
            return <div className="recent-day" key={dateKey}><div className="recent-day-top"><span>{getDateLabel(dateKey)}</span><strong>{dayProgress.percentage}%</strong></div><div className="progress-bar"><div className="progress-fill" style={{ width: `${dayProgress.percentage}%` }} /></div></div>
          })}
        </div>
      </div>
    </section>
  )

  const exportBackup = () => {
    const keys = [
      'task-definitions',
      'long-term-goals',
      'daily-history',
      `daily-xp-${todayKey}`,
      `weekly-bonus-${getWeekStartKey()}`,
    ]

    const backup = {
      app: 'Daily Progress',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {},
    }

    keys.forEach((key) => {
      const value = localStorage.getItem(key)
      if (value !== null) backup.data[key] = value
    })

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `daily-progress-backup-${todayKey}.json`
    link.click()
    URL.revokeObjectURL(url)
    setBackupMessage('✅ Backup zapisany na urządzeniu.')
  }

  const importBackup = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result)
        if (!backup?.data || backup.app !== 'Daily Progress') {
          throw new Error('Nieprawidłowy backup')
        }

        Object.entries(backup.data).forEach(([key, value]) => {
          if (typeof value === 'string') localStorage.setItem(key, value)
        })

        setBackupMessage('✅ Backup wczytany. Odśwież aplikację.')
      } catch {
        setBackupMessage('❌ Ten plik nie jest poprawnym backupem aplikacji.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const renderSettings = () => (
    <section className="settings-section">
      <div className="history-header">
        <p className="eyebrow">KONFIGURACJA</p>
        <h1>Ustawienia ⚙️</h1>
        <p className="date">Ustaw zadania, XP i priorytety.</p>
      </div>

      <div className="settings-block appearance-settings">
        <div className="settings-block-header">
          <div>
            <h2>Wygląd aplikacji 📐</h2>
            <p>Zmień wielkość ikon, tekstów i elementów interfejsu.</p>
          </div>
        </div>
        <div className="ui-scale-options" role="group" aria-label="Wielkość interfejsu">
          <button className={uiScale === 'small' ? 'selected' : ''} onClick={() => setUiScale('small')}>
            <span>ᵃ</span><strong>Mały</strong><small>więcej na ekranie</small>
          </button>
          <button className={uiScale === 'medium' ? 'selected' : ''} onClick={() => setUiScale('medium')}>
            <span>ᵃᵃ</span><strong>Średni</strong><small>domyślny</small>
          </button>
          <button className={uiScale === 'large' ? 'selected' : ''} onClick={() => setUiScale('large')}>
            <span>ᵃᵃᵃ</span><strong>Duży</strong><small>większe elementy</small>
          </button>
        </div>
      </div>

      <div className="settings-block">
        <div className="settings-block-header">
          <div><h2>Moje zadania</h2><p>Na głównej pokazujemy maksymalnie 5 priorytetów.</p></div>
          <button className="add-task-button" onClick={openAddTask}>+ Dodaj</button>
        </div>

        <div className="settings-tasks">
          {taskDefinitions.map((task) => (
            <div className="settings-task" key={task.id}>
              <span className="settings-task-emoji">{task.emoji}</span>
              <div className="settings-task-info">
                <strong>{task.title}</strong>
                <small>{task.category} • {task.type === 'counter' ? `${task.minimumTarget}/${task.target}/${task.bonusTarget} ${task.unit}` : 'Odhaczenie'} • {task.xp} XP</small>
                <div className="task-days-preview">{WEEKDAYS.filter((day) => task.days.includes(day.id)).map((day) => <span key={day.id}>{day.short}</span>)}</div>
              </div>
              <button className={`important-button ${task.important ? 'active' : ''}`} title="Pokaż na głównej" onClick={() => toggleImportant(task.id)}>★</button>
              <div className="settings-actions"><button className="edit-button" onClick={() => openEditTask(task)}>✏️</button><button className="delete-button" onClick={() => deleteTask(task.id)}>🗑️</button></div>
            </div>
          ))}
        </div>
      </div>

      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><div><p className="eyebrow">{editingTaskId ? 'EDYCJA' : 'NOWE ZADANIE'}</p><h2>{editingTaskId ? 'Edytuj zadanie' : 'Dodaj zadanie'}</h2></div><button className="close-button" onClick={closeTaskModal}>×</button></div>

            <label>Nazwa<input type="text" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} placeholder="np. Czytać książkę" /></label>
            <label>Opis<input type="text" value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} placeholder="np. 30 minut" /></label>
            <label>Emoji<input type="text" value={taskForm.emoji} onChange={(event) => setTaskForm({ ...taskForm, emoji: event.target.value })} placeholder="🎯" /></label>
            <label>Kategoria<select value={taskForm.category} onChange={(event) => setTaskForm({ ...taskForm, category: event.target.value })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Typ zadania<select value={taskForm.type} onChange={(event) => setTaskForm({ ...taskForm, type: event.target.value })}><option value="checkbox">Odhaczenie</option><option value="counter">Licznik</option></select></label>

            {taskForm.type === 'counter' && <>
              <div className="tier-form-grid">
                <label>Minimum<input type="number" min="1" value={taskForm.minimumTarget} onChange={(event) => setTaskForm({ ...taskForm, minimumTarget: event.target.value })} /></label>
                <label>Cel<input type="number" min="1" value={taskForm.target} onChange={(event) => setTaskForm({ ...taskForm, target: event.target.value })} /></label>
                <label>Bonus<input type="number" min="1" value={taskForm.bonusTarget} onChange={(event) => setTaskForm({ ...taskForm, bonusTarget: event.target.value })} /></label>
              </div>
              <label>Jednostka<input type="text" value={taskForm.unit} onChange={(event) => setTaskForm({ ...taskForm, unit: event.target.value })} placeholder="np. razy, minut, kcal" /></label>
              <label>Przyrost<input type="number" min="1" value={taskForm.step} onChange={(event) => setTaskForm({ ...taskForm, step: event.target.value })} /></label>
              <div className="tier-form-grid">
                <label>XP minimum<input type="number" min="1" value={taskForm.minimumXp} onChange={(event) => setTaskForm({ ...taskForm, minimumXp: event.target.value })} /></label>
                <label>XP cel<input type="number" min="5" value={taskForm.xp} onChange={(event) => setTaskForm({ ...taskForm, xp: event.target.value })} /></label>
                <label>XP bonus<input type="number" min="5" value={taskForm.bonusXp} onChange={(event) => setTaskForm({ ...taskForm, bonusXp: event.target.value })} /></label>
              </div>
            </>}

            {taskForm.type === 'checkbox' && (
              <label>XP za wykonanie<input type="number" min="5" value={taskForm.xp} onChange={(event) => setTaskForm({ ...taskForm, xp: event.target.value, minimumXp: event.target.value, bonusXp: event.target.value })} /></label>
            )}

            <label className="important-toggle"><input type="checkbox" checked={taskForm.important} onChange={(event) => setTaskForm({ ...taskForm, important: event.target.checked })} /><span>Pokaż to zadanie na głównej</span></label>

            <div className="days-picker"><span className="days-picker-title">Pojawia się w dni:</span><div className="days-picker-grid">{WEEKDAYS.map((day) => { const selected = taskForm.days.includes(day.id); return <button key={day.id} type="button" className={`day-button ${selected ? 'selected' : ''}`} onClick={() => toggleFormDay(day.id)}>{day.short}</button> })}</div></div>

            <button className="save-task-button" onClick={saveTaskDefinition}>{editingTaskId ? 'Zapisz zmiany' : 'Dodaj zadanie'}</button>
          </div>
        </div>
      )}

      <div className="backup-block settings-block">
        <div className="settings-block-header">
          <div>
            <h2>Backup danych 💾</h2>
            <p>Zapisz XP, historię, zadania i cele w jednym pliku.</p>
          </div>
          <button className="add-task-button" onClick={exportBackup}>Eksportuj</button>
        </div>

        <label className="backup-import-label">
          <span>Wczytaj backup</span>
          <input type="file" accept="application/json,.json" onChange={importBackup} />
        </label>

        {backupMessage && <p className="backup-message">{backupMessage}</p>}
      </div>
    </section>
  )

  const renderBadges = () => (
    <section className="badges-section">
      <div className="history-header">
        <p className="eyebrow">KOLEKCJA</p>
        <h1>Odznaki 🏆</h1>
        <p className="date">{unlockedBadges}/{BADGES.length} odblokowanych.</p>
      </div>

      <div className="badges-grid">
        {BADGES.map((badge) => {
          const unlocked = badge.check(badgeContext)
          return (
            <div className={`badge-card ${unlocked ? 'unlocked' : 'locked'}`} key={badge.id}>
              <div className="badge-icon">{unlocked ? badge.emoji : '🔒'}</div>
              <div className="badge-info">
                <strong>{badge.name}</strong>
                <small>{badge.description}</small>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )

  const renderRanks = () => (
    <section className="ranks-section">
      <div className="history-header">
        <p className="eyebrow">TWÓJ POZIOM</p>
        <h1>Droga rang 👑</h1>
        <p className="date">Ranga rośnie dzięki XP, nie przez sam streak.</p>
      </div>

      <div className="rank-hero">
        <div className="rank-hero-icon">{rank.emoji}</div>
        <div>
          <span className="eyebrow">AKTUALNA RANGA</span>
          <h2>{rank.name}</h2>
          <p>{totalXp.toLocaleString('pl-PL')} XP</p>
        </div>
      </div>

      <div className="rank-list">
        {RANKS.map((item) => {
          const unlocked = totalXp >= item.minXp
          const isCurrent = item.name === rank.name
          return (
            <div className={`rank-step ${unlocked ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}`} key={item.name}>
              <div className="rank-step-icon">{unlocked ? item.emoji : '🔒'}</div>
              <div className="rank-step-info"><strong>{item.name}</strong><small>{item.minXp.toLocaleString('pl-PL')} XP</small></div>
              <span>{unlocked ? '✓' : `${Math.max(0, item.minXp - totalXp).toLocaleString('pl-PL')} XP`}</span>
            </div>
          )
        })}
      </div>
    </section>
  )

  const renderProfile = () => (
    <section className="profile-section">
      <div className="profile-hero">
        <div className="profile-avatar">{rank.emoji}</div>

        <div className="profile-identity">
          <span className="eyebrow">TWÓJ PROFIL</span>
          <h1>{rank.name}</h1>
          <p>Level {levelInfo.level} • {totalXp.toLocaleString('pl-PL')} XP</p>
        </div>

        <div className="profile-streak">
          <span>🔥</span>
          <strong>{currentStreak}</strong>
          <small>streak</small>
        </div>
      </div>

      <div className="level-card">
        <div className="level-card-top">
          <div>
            <span className="progress-title">LEVEL {levelInfo.level}</span>
            <strong>{levelInfo.progressXp} / {levelInfo.neededXp} XP</strong>
          </div>
          <span className="level-percent">{levelInfo.percentage}%</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${levelInfo.percentage}%` }}
          />
        </div>

        <p className="progress-text">
          {levelInfo.neededXp - levelInfo.progressXp} XP do Level {levelInfo.level + 1}
        </p>
      </div>

      <div className="profile-stats-grid">
        <div className="stat-card">
          <span>⚡</span>
          <strong>{totalXp.toLocaleString('pl-PL')}</strong>
          <small>Łączne XP</small>
        </div>
        <div className="stat-card">
          <span>🔥</span>
          <strong>{currentStreak}</strong>
          <small>Aktualny streak</small>
        </div>
        <div className="stat-card">
          <span>🏆</span>
          <strong>{completedDays}</strong>
          <small>Ukończonych dni</small>
        </div>
        <div className="stat-card">
          <span>✅</span>
          <strong>{unlockedBadges}</strong>
          <small>Odznak</small>
        </div>
      </div>

      <div className="profile-section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">NAJMOCNIEJSZE STRONY</p>
            <h2>Gdzie jesteś najmocniejszy?</h2>
          </div>
        </div>

        <div className="strongest-list">
          {strongestCategories.length ? strongestCategories.map((item, index) => (
            <div className="strongest-row" key={item.category}>
              <div className="strongest-rank">{index + 1}</div>
              <div className="strongest-info">
                <strong>{item.category}</strong>
                <small>{item.completed}/{item.total} ukończonych</small>
              </div>
              <strong>{item.percentage}%</strong>
            </div>
          )) : (
            <div className="empty-state">Zacznij wykonywać zadania, a tutaj pojawią się Twoje mocne strony.</div>
          )}
        </div>
      </div>

      <div className="profile-section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">NASTĘPNY CEL</p>
            <h2>{nextRank ? `${nextRank.emoji} ${nextRank.name}` : '👑 Maksymalna ranga'}</h2>
          </div>
        </div>

        <div className="next-rank-card">
          <div className="next-rank-top">
            <span>{nextRank ? `${Math.max(0, nextRank.minXp - totalXp).toLocaleString('pl-PL')} XP brakuje` : 'Jesteś na szczycie.'}</span>
            <strong>{nextRank ? `${nextRank.minXp.toLocaleString('pl-PL')} XP` : 'MAX'}</strong>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${rankProgress}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  )

  const renderGoals = () => (
    <section className="goals-section">
      <div className="history-header">
        <p className="eyebrow">DŁUGOTERMINOWY PROGRES</p>
        <h1>Cele 🎯</h1>
        <p className="date">Buduj rzeczy, które mają znaczenie za miesiąc i za rok.</p>
      </div>

      <div className="goals-hero">
        <div>
          <span>⭐ PRIORYTETOWE CELE</span>
          <strong>{goals.filter((goal) => goal.important).length}</strong>
          <small>wyróżnionych na głównej</small>
        </div>
        <button className="add-task-button" onClick={openAddGoal}>+ Dodaj cel</button>
      </div>

      <div className="goals-list">
        {goals.length ? goals.map((goal) => {
          const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100))
          const completed = goal.current >= goal.target
          return (
            <div className={`goal-card ${completed ? 'completed' : ''}`} key={goal.id}>
              <div className="goal-top">
                <div className="goal-icon">{goal.emoji}</div>
                <div className="goal-info">
                  <span>{goal.category}</span>
                  <strong>{goal.title}</strong>
                  <small>{goal.current.toLocaleString('pl-PL')} / {goal.target.toLocaleString('pl-PL')} {goal.unit}</small>
                </div>
                <button className={`important-button ${goal.important ? 'active' : ''}`} onClick={() => toggleGoalImportant(goal.id)}>★</button>
                <button className="edit-button" onClick={() => openEditGoal(goal)}>✏️</button>
                <button className="delete-button" onClick={() => deleteGoal(goal.id)}>🗑️</button>
              </div>
              <div className="goal-progress-row">
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${percentage}%` }} /></div>
                <strong>{percentage}%</strong>
              </div>
              {!completed && (
                <div className="goal-controls">
                  <button onClick={() => updateGoalValue(goal.id, -1)}>−</button>
                  <span>Dodaj postęp</span>
                  <button onClick={() => updateGoalValue(goal.id, 1)}>+1</button>
                </div>
              )}
              {completed && <div className="goal-complete">🏆 Cel osiągnięty!</div>}
            </div>
          )
        }) : <div className="empty-state">Dodaj pierwszy cel.</div>}
      </div>

      <div className="goal-tip">
        <span>💡</span>
        <div><strong>Tip</strong><small>Możemy później automatycznie łączyć cele z zadaniami, np. każdy short zwiększa cel „500 shortów”.</small></div>
      </div>

      {showGoalModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div><p className="eyebrow">{editingGoalId ? 'EDYCJA CELU' : 'NOWY CEL'}</p><h2>{editingGoalId ? 'Edytuj cel' : 'Dodaj cel'}</h2></div>
              <button className="close-button" onClick={closeGoalModal}>×</button>
            </div>
            <label>Nazwa celu<input value={goalForm.title} onChange={(event) => setGoalForm({ ...goalForm, title: event.target.value })} placeholder="np. 1000 subów" /></label>
            <label>Emoji<input value={goalForm.emoji} onChange={(event) => setGoalForm({ ...goalForm, emoji: event.target.value })} placeholder="🎯" /></label>
            <label>Kategoria<select value={goalForm.category} onChange={(event) => setGoalForm({ ...goalForm, category: event.target.value })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Aktualny wynik<input type="number" min="0" value={goalForm.current} onChange={(event) => setGoalForm({ ...goalForm, current: event.target.value })} /></label>
            <label>Cel końcowy<input type="number" min="1" value={goalForm.target} onChange={(event) => setGoalForm({ ...goalForm, target: event.target.value })} /></label>
            <label>Jednostka<input value={goalForm.unit} onChange={(event) => setGoalForm({ ...goalForm, unit: event.target.value })} placeholder="np. subów, zł, shortów" /></label>
            <label className="important-toggle"><input type="checkbox" checked={goalForm.important} onChange={(event) => setGoalForm({ ...goalForm, important: event.target.checked })} /><span>Pokaż na głównej</span></label>
            <button className="save-task-button" onClick={saveGoal}>{editingGoalId ? 'Zapisz zmiany' : 'Dodaj cel'}</button>
          </div>
        </div>
      )}
    </section>
  )

  const renderMore = () => (
    <section className="more-section">
      <div className="history-header"><p className="eyebrow">WIĘCEJ</p><h1>Menu 🧰</h1><p className="date">Reszta Twojego systemu.</p></div>
      <div className="more-grid">
        <button onClick={() => setActivePage('badges')}><span>🏆</span><strong>Odznaki</strong><small>{unlockedBadges}/{BADGES.length} zdobytych</small></button>
        <button onClick={() => setActivePage('weekly')}><span>🎯</span><strong>Wyzwania</strong><small>{weeklyCompletedCount}/{weeklyChallenges.length} ukończone</small></button>
        <button onClick={() => setActivePage('ranks')}><span>{rank.emoji}</span><strong>Rangi</strong><small>Sprawdź drogę XP</small></button>
        <button onClick={() => setActivePage('history')}><span>📅</span><strong>Historia</strong><small>Poprzednie dni</small></button>
        <button onClick={() => setActivePage('stats')}><span>📊</span><strong>Statystyki</strong><small>XP, streak, ranga</small></button>
        <button onClick={() => setActivePage('settings')}><span>⚙️</span><strong>Ustawienia</strong><small>Edytuj zadania</small></button>
        <button onClick={() => setActivePage('goals')}><span>🎯</span><strong>Cele</strong><small>{goals.filter((goal) => goal.important).length} priorytetowych</small></button>
        <button onClick={() => setActivePage('profile')}><span>👤</span><strong>Profil gracza</strong><small>Level, XP i mocne strony</small></button>
        <button onClick={() => setActivePage('categories')}><span>🗂️</span><strong>Kategorie</strong><small>YouTube, Zdrowie, Sport i więcej</small></button>
      </div>
    </section>
  )

  let content = renderToday()
  if (activePage === 'youtube') content = renderCategory('YouTube')
  if (activePage === 'health') content = renderCategory('Zdrowie')
  if (activePage === 'sport') content = renderCategory('Sport')
  if (activePage === 'category-Nauka') content = renderCategory('Nauka')
  if (activePage === 'category-Praca') content = renderCategory('Praca')
  if (activePage === 'category-Inne') content = renderCategory('Inne')
  if (activePage === 'categories') content = renderCategories()
  if (activePage === 'more') content = renderMore()
  if (activePage === 'weekly') content = renderWeekly()
  if (activePage === 'badges') content = renderBadges()
  if (activePage === 'ranks') content = renderRanks()
  if (activePage === 'history') content = renderHistory()
  if (activePage === 'stats') content = renderStats()
  if (activePage === 'settings') content = renderSettings()
  if (activePage === 'profile') content = renderProfile()
  if (activePage === 'goals') content = renderGoals()

  return (
    <div className={`app ui-scale-${uiScale}`}>
      <main className="container">
        {content}

        {activeReward !== null && (
          <div className="xp-reward-layer" aria-live="polite">
            <div className="confetti" aria-hidden="true">
              {confetti.map((piece) => (
                <span
                  key={piece.id}
                  style={{
                    left: `${piece.left}%`,
                    animationDelay: `${piece.delay}s`,
                    '--drift': `${piece.drift}px`,
                    '--rotation': `${piece.rotation}deg`,
                    '--size': `${piece.size}px`,
                    '--duration': `${piece.duration}s`,
                  }}
                />
              ))}
            </div>

            <div className="xp-reward-card">
              <span className="xp-reward-spark">⚡</span>
              <strong>+{activeReward.xp} XP</strong>
              <small>{activeReward.message}</small>
            </div>
          </div>
        )}

        <nav className="bottom-nav">
          <button className={`nav-item ${activePage === 'today' ? 'active' : ''}`} onClick={() => setActivePage('today')}><span>🏠</span><small>Główna</small></button>
          <button className={`nav-item ${activePage === 'categories' || ['youtube', 'health', 'sport', 'category-Nauka', 'category-Praca', 'category-Inne'].includes(activePage) ? 'active' : ''}`} onClick={() => setActivePage('categories')}><span>🗂️</span><small>Kategorie</small></button>
          <button className={`nav-item ${activePage === 'profile' ? 'active' : ''}`} onClick={() => setActivePage('profile')}><span>👤</span><small>Profil</small></button>
          <button className={`nav-item ${activePage === 'stats' ? 'active' : ''}`} onClick={() => setActivePage('stats')}><span>📊</span><small>Statystyki</small></button>
          <button className={`nav-item ${['more', 'weekly', 'badges', 'ranks', 'history', 'settings', 'goals'].includes(activePage) ? 'active' : ''}`} onClick={() => setActivePage('more')}><span>•••</span><small>Więcej</small></button>
        </nav>
      </main>
    </div>
  )
}

export default App
