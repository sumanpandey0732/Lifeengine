import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "missed";
  dueDate?: string;
  estimatedMinutes: number;
  xpReward: number;
  category: string;
  createdAt: string;
  completedAt?: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
  frequency: "daily" | "weekly";
  targetCount: number;
  completedDates: string[];
  streak: number;
  longestStreak: number;
  xpReward: number;
  createdAt: string;
}

export interface MoodLog {
  id: string;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  note?: string;
  timestamp: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle: string;
  durationMinutes: number;
  completedMinutes: number;
  status: "active" | "completed" | "abandoned";
  startTime: string;
  endTime?: string;
  xpEarned: number;
  focusScore: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  progress: number;
  milestones: { id: string; title: string; completed: boolean }[];
  xpReward: number;
  createdAt: string;
  status: "active" | "completed" | "abandoned";
}

export interface UserProfile {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXP: number;
  disciplineScore: number;
  productivityScore: number;
  focusScore: number;
  lifeScore: number;
  streakDays: number;
  lastActiveDate: string;
  achievements: string[];
  notificationPersonality: "strict" | "motivational" | "humorous";
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: "reminder" | "escalation" | "motivational" | "achievement" | "warning";
  level: 1 | 2 | 3 | 4;
  timestamp: string;
  read: boolean;
}

export interface AppState {
  profile: UserProfile;
  tasks: Task[];
  habits: Habit[];
  moodLogs: MoodLog[];
  focusSessions: FocusSession[];
  goals: Goal[];
  notifications: Notification[];
  activeSession: FocusSession | null;
  dailyQuote: string;
  weeklyReport: string | null;
  isAiLoading: boolean;
}

interface AppContextType extends AppState {
  addTask: (task: Omit<Task, "id" | "createdAt" | "status">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  addHabit: (habit: Omit<Habit, "id" | "createdAt" | "completedDates" | "streak" | "longestStreak">) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  completeHabit: (id: string) => void;
  logMood: (mood: 1 | 2 | 3 | 4 | 5, energy: 1 | 2 | 3 | 4 | 5, note?: string) => void;
  startFocusSession: (taskTitle: string, durationMinutes: number, taskId?: string) => void;
  completeFocusSession: (sessionId: string, completedMinutes: number) => void;
  abandonFocusSession: (sessionId: string) => void;
  addGoal: (goal: Omit<Goal, "id" | "createdAt" | "progress" | "status">) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addNotification: (notif: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAllNotificationsRead: () => void;
  addXP: (amount: number) => void;
  updateDailyQuote: (quote: string) => void;
  refreshScores: () => void;
  generateMicroAction: () => Task;
}

const STORAGE_KEY = "life_engine_ultra_v2";

const MOTIVATIONAL_QUOTES = [
  "Bhai padhai kar le, kal mobile chalana! 😤",
  "Procrastination steals your XP — act NOW!",
  "Life is too short to waste. Start NOW!",
  "Every minute counts — push forward!",
  "Small actions today = big rewards tomorrow!",
  "Focus now, enjoy later. No shortcuts.",
  "Arre yaar, kitna soyega? Uth aur kaam kar!",
  "Your future self is watching. Don't disappoint.",
  "Winners don't wait for motivation. They move.",
  "Discipline = Freedom. Laziness = Prison.",
  "Bhai ek kaam kar, phone rakh aur padh!",
  "2 minutes of action beats 2 hours of thinking.",
  "The pain of discipline < the pain of regret.",
  "You said you wanted this. Prove it.",
  "Chalo uth, kuch bada karte hain aaj!",
];

const MICRO_ACTIONS = [
  "Do 10 pushups right now",
  "Write 3 lines of notes",
  "Read for 5 minutes",
  "Clear your desk completely",
  "Plan tomorrow's top 3 tasks",
  "Take 10 deep breaths",
  "Write down one goal you're procrastinating on",
  "Send one important message you've been delaying",
  "Drink a full glass of water",
  "Write 3 things you're grateful for",
  "Stand up and stretch for 2 minutes",
  "Review your goals for today",
  "Delete 5 unnecessary apps",
  "Write down your #1 priority",
  "Set a 25-minute focus timer right now",
];

function createId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function calcLifeScore(discipline: number, productivity: number, focus: number): number {
  return Math.round(discipline * 0.4 + productivity * 0.3 + focus * 0.3);
}

function calcLevel(totalXP: number): { level: number; xp: number; xpToNextLevel: number } {
  const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
  const xpForCurrentLevel = (level - 1) * (level - 1) * 100;
  const xpForNextLevel = level * level * 100;
  return { level, xp: totalXP - xpForCurrentLevel, xpToNextLevel: xpForNextLevel - xpForCurrentLevel };
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Warrior",
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  totalXP: 0,
  disciplineScore: 50,
  productivityScore: 50,
  focusScore: 50,
  lifeScore: 50,
  streakDays: 0,
  lastActiveDate: todayStr(),
  achievements: [],
  notificationPersonality: "motivational",
};

const DEFAULT_STATE: AppState = {
  profile: DEFAULT_PROFILE,
  tasks: [],
  habits: [],
  moodLogs: [],
  focusSessions: [],
  goals: [],
  notifications: [],
  activeSession: null,
  dailyQuote: MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)],
  weeklyReport: null,
  isAiLoading: false,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    if (state !== DEFAULT_STATE) {
      saveState(state);
    }
  }, [state]);

  async function loadState() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as AppState;
        setState({ ...DEFAULT_STATE, ...saved });
      } else {
        setState({
          ...DEFAULT_STATE,
          dailyQuote: MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)],
        });
      }
    } catch {
      setState(DEFAULT_STATE);
    }
  }

  async function saveState(s: AppState) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {}
  }

  const addXP = useCallback((amount: number) => {
    setState((prev) => {
      const newTotal = prev.profile.totalXP + amount;
      const { level, xp, xpToNextLevel } = calcLevel(newTotal);
      const newNotifs: Notification[] = [];
      if (level > prev.profile.level) {
        newNotifs.push({
          id: createId(),
          title: "LEVEL UP!",
          body: `You reached Level ${level}! Keep pushing!`,
          type: "achievement",
          level: 1,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
      return {
        ...prev,
        profile: {
          ...prev.profile,
          totalXP: newTotal,
          level,
          xp,
          xpToNextLevel,
        },
        notifications: [...newNotifs, ...prev.notifications].slice(0, 50),
      };
    });
  }, []);

  const refreshScores = useCallback(() => {
    setState((prev) => {
      const today = todayStr();
      const completedToday = prev.tasks.filter(
        (t) => t.status === "completed" && t.completedAt?.startsWith(today)
      ).length;
      const totalTasks = prev.tasks.filter((t) => t.createdAt.startsWith(today)).length || 1;
      const productivity = Math.min(100, Math.round((completedToday / totalTasks) * 100));

      const completedSessions = prev.focusSessions.filter(
        (s) => s.status === "completed" && s.startTime.startsWith(today)
      );
      const totalFocusMinutes = completedSessions.reduce((a, s) => a + s.completedMinutes, 0);
      const focus = Math.min(100, Math.round((totalFocusMinutes / 120) * 100));

      const habitsCompletedToday = prev.habits.filter((h) =>
        h.completedDates.includes(today)
      ).length;
      const discipline = Math.min(
        100,
        Math.round(
          prev.profile.streakDays * 2 +
            (habitsCompletedToday / (prev.habits.length || 1)) * 60 +
            20
        )
      );

      return {
        ...prev,
        profile: {
          ...prev.profile,
          disciplineScore: discipline,
          productivityScore: productivity,
          focusScore: focus,
          lifeScore: calcLifeScore(discipline, productivity, focus),
        },
      };
    });
  }, []);

  const addTask = useCallback((task: Omit<Task, "id" | "createdAt" | "status">) => {
    const newTask: Task = {
      ...task,
      id: createId(),
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    setState((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
  }, []);

  const completeTask = useCallback((id: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === id);
      if (!task) return prev;
      const updatedTask = { ...task, status: "completed" as const, completedAt: new Date().toISOString() };
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? updatedTask : t)),
        notifications: [
          {
            id: createId(),
            title: "Task Complete!",
            body: `"${task.title}" done! +${task.xpReward} XP earned`,
            type: "achievement",
            level: 1,
            timestamp: new Date().toISOString(),
            read: false,
          } as Notification,
          ...prev.notifications,
        ].slice(0, 50),
      };
    });
    const task = stateRef.current.tasks.find((t) => t.id === id);
    if (task) addXP(task.xpReward);
    refreshScores();
  }, [addXP, refreshScores]);

  const addHabit = useCallback((habit: Omit<Habit, "id" | "createdAt" | "completedDates" | "streak" | "longestStreak">) => {
    const newHabit: Habit = {
      ...habit,
      id: createId(),
      createdAt: new Date().toISOString(),
      completedDates: [],
      streak: 0,
      longestStreak: 0,
    };
    setState((prev) => ({ ...prev, habits: [newHabit, ...prev.habits] }));
  }, []);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setState((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
  }, []);

  const completeHabit = useCallback((id: string) => {
    const today = todayStr();
    setState((prev) => {
      const habit = prev.habits.find((h) => h.id === id);
      if (!habit || habit.completedDates.includes(today)) return prev;
      const newDates = [...habit.completedDates, today];
      const newStreak = habit.streak + 1;
      const updated = { ...habit, completedDates: newDates, streak: newStreak, longestStreak: Math.max(newStreak, habit.longestStreak) };
      return { ...prev, habits: prev.habits.map((h) => (h.id === id ? updated : h)) };
    });
    const habit = stateRef.current.habits.find((h) => h.id === id);
    if (habit) addXP(habit.xpReward);
    refreshScores();
  }, [addXP, refreshScores]);

  const logMood = useCallback((mood: 1 | 2 | 3 | 4 | 5, energy: 1 | 2 | 3 | 4 | 5, note?: string) => {
    const log: MoodLog = {
      id: createId(),
      mood,
      energy,
      note,
      timestamp: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, moodLogs: [log, ...prev.moodLogs].slice(0, 100) }));
  }, []);

  const startFocusSession = useCallback((taskTitle: string, durationMinutes: number, taskId?: string) => {
    const session: FocusSession = {
      id: createId(),
      taskId,
      taskTitle,
      durationMinutes,
      completedMinutes: 0,
      status: "active",
      startTime: new Date().toISOString(),
      xpEarned: 0,
      focusScore: 0,
    };
    setState((prev) => ({ ...prev, activeSession: session, focusSessions: [session, ...prev.focusSessions] }));
  }, []);

  const completeFocusSession = useCallback((sessionId: string, completedMinutes: number) => {
    const focusScore = Math.round((completedMinutes / (stateRef.current.activeSession?.durationMinutes || 25)) * 100);
    const xpEarned = Math.round(completedMinutes * 3 + focusScore * 0.5);
    setState((prev) => ({
      ...prev,
      activeSession: null,
      focusSessions: prev.focusSessions.map((s) =>
        s.id === sessionId
          ? { ...s, status: "completed", completedMinutes, endTime: new Date().toISOString(), xpEarned, focusScore }
          : s
      ),
    }));
    addXP(xpEarned);
    refreshScores();
  }, [addXP, refreshScores]);

  const abandonFocusSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      activeSession: null,
      focusSessions: prev.focusSessions.map((s) =>
        s.id === sessionId ? { ...s, status: "abandoned", endTime: new Date().toISOString() } : s
      ),
    }));
  }, []);

  const addGoal = useCallback((goal: Omit<Goal, "id" | "createdAt" | "progress" | "status">) => {
    const newGoal: Goal = {
      ...goal,
      id: createId(),
      createdAt: new Date().toISOString(),
      progress: 0,
      status: "active",
    };
    setState((prev) => ({ ...prev, goals: [newGoal, ...prev.goals] }));
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState((prev) => ({ ...prev, goals: prev.goals.filter((g) => g.id !== id) }));
  }, []);

  const addNotification = useCallback((notif: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotif: Notification = {
      ...notif,
      id: createId(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setState((prev) => ({ ...prev, notifications: [newNotif, ...prev.notifications].slice(0, 50) }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const updateDailyQuote = useCallback((quote: string) => {
    setState((prev) => ({ ...prev, dailyQuote: quote }));
  }, []);

  const generateMicroAction = useCallback((): Task => {
    const title = MICRO_ACTIONS[Math.floor(Math.random() * MICRO_ACTIONS.length)];
    return {
      id: createId(),
      title,
      priority: "medium",
      status: "pending",
      estimatedMinutes: 2,
      xpReward: 15,
      category: "micro",
      createdAt: new Date().toISOString(),
    };
  }, []);

  const ctx: AppContextType = {
    ...state,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    logMood,
    startFocusSession,
    completeFocusSession,
    abandonFocusSession,
    addGoal,
    updateGoal,
    deleteGoal,
    addNotification,
    markAllNotificationsRead,
    addXP,
    updateDailyQuote,
    refreshScores,
    generateMicroAction,
  };

  return React.createElement(AppContext.Provider, { value: ctx }, children);
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { MOTIVATIONAL_QUOTES };
