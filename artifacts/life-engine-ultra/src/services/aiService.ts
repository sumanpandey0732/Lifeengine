import { MOTIVATIONAL_QUOTES } from "@/src/store/useAppStore";

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const PRIMARY_MODEL = "mistralai/mistral-7b-instruct";
const FALLBACK_MODEL = "openchat/openchat-3.5";

interface AICallOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
}

async function callAI(opts: AICallOptions): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("No OpenRouter API key configured");
  }

  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  for (const model of models) {
    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://life-engine-ultra.replit.app",
          "X-Title": "Life Engine Ultra",
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(opts.systemPrompt ? [{ role: "system", content: opts.systemPrompt }] : []),
            { role: "user", content: opts.prompt },
          ],
          max_tokens: opts.maxTokens || 300,
          temperature: 0.8,
        }),
      });

      if (!response.ok) continue;
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || "";
    } catch {
      continue;
    }
  }
  throw new Error("All AI models failed");
}

export async function generateDailyMotivation(userData: {
  lifeScore: number;
  streakDays: number;
  pendingTasks: number;
  name: string;
}): Promise<string> {
  try {
    const quote = await callAI({
      systemPrompt: "You are a fierce, no-nonsense life coach. Generate ONE short motivational quote (max 15 words). Mix English and Hindi naturally like Indian youth speak. Be direct, punchy, slightly funny. No emojis. No hashtags.",
      prompt: `User: ${userData.name}, Life Score: ${userData.lifeScore}/100, Streak: ${userData.streakDays} days, Pending tasks: ${userData.pendingTasks}. Generate a personalized motivational quote.`,
      maxTokens: 60,
    });
    return quote || MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  } catch {
    return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  }
}

export async function generateReminderText(task: {
  title: string;
  priority: string;
  overdue: boolean;
}): Promise<string> {
  try {
    return await callAI({
      systemPrompt: "You are a strict productivity enforcer. Generate a short, urgent reminder (max 12 words). Mix Hindi-English style. Be pushy.",
      prompt: `Task: "${task.title}", Priority: ${task.priority}, Overdue: ${task.overdue}. Write urgent reminder.`,
      maxTokens: 50,
    });
  } catch {
    return task.overdue
      ? `"${task.title}" is OVERDUE! Do it NOW!`
      : `Time to work on "${task.title}"!`;
  }
}

export async function analyzeBehavior(userData: {
  completedTasks: number;
  missedTasks: number;
  avgFocusMinutes: number;
  habitStreak: number;
  lifeScore: number;
}): Promise<string> {
  try {
    return await callAI({
      systemPrompt: "You are a behavioral analyst. Give 2-3 sharp insights about user's discipline patterns. Be direct and specific. Max 60 words.",
      prompt: `Completed tasks: ${userData.completedTasks}, Missed: ${userData.missedTasks}, Avg focus: ${userData.avgFocusMinutes}min, Habit streak: ${userData.habitStreak}, Life Score: ${userData.lifeScore}`,
      maxTokens: 120,
    });
  } catch {
    return "Keep building consistency. Focus sessions are your superpower. Don't miss habits — they compound.";
  }
}

export async function predictNextBestAction(userData: {
  pendingTasks: string[];
  energyLevel: number;
  timeOfDay: string;
  recentFocusMinutes: number;
}): Promise<string> {
  try {
    return await callAI({
      systemPrompt: "You are a productivity AI. Suggest the single best action to take right now. Be specific. Max 20 words.",
      prompt: `Pending: ${userData.pendingTasks.slice(0, 3).join(", ")}, Energy: ${userData.energyLevel}/5, Time: ${userData.timeOfDay}, Recent focus: ${userData.recentFocusMinutes}min`,
      maxTokens: 60,
    });
  } catch {
    if (userData.recentFocusMinutes < 25) return "Start a 25-minute Pomodoro session on your top priority task.";
    return "Take a 5-minute break, then tackle your most urgent task.";
  }
}

export async function generateWeeklyReport(userData: {
  totalXP: number;
  completedTasks: number;
  focusHours: number;
  topHabit: string;
  lifeScore: number;
}): Promise<string> {
  try {
    return await callAI({
      systemPrompt: "You are a weekly performance coach. Generate a punchy weekly report with: 1 win, 1 weakness, 1 action plan. Max 80 words. Use bold formatting with **text**.",
      prompt: `XP earned: ${userData.totalXP}, Tasks completed: ${userData.completedTasks}, Focus hours: ${userData.focusHours.toFixed(1)}, Top habit: ${userData.topHabit}, Life Score: ${userData.lifeScore}`,
      maxTokens: 150,
    });
  } catch {
    return `**This Week's Report**\n\nYou're building momentum. Keep consistent with daily habits — they're your foundation. Next week: aim for 5+ focus sessions and zero missed tasks. Your best days are ahead.`;
  }
}

export async function suggestMicroActions(userData: {
  idleMinutes: number;
  energyLevel: number;
  pendingTasks: string[];
}): Promise<string[]> {
  try {
    const result = await callAI({
      systemPrompt: "Generate 3 ultra-short micro-actions (2-5 min each). One per line. No numbering. Be specific. Mix Hindi-English naturally.",
      prompt: `User idle ${userData.idleMinutes}min, energy ${userData.energyLevel}/5, pending: ${userData.pendingTasks.slice(0, 2).join(", ")}`,
      maxTokens: 80,
    });
    return result.split("\n").filter((l) => l.trim()).slice(0, 3);
  } catch {
    return [
      "Do 10 pushups right now",
      "Write tomorrow's top 3 tasks",
      "Read 2 pages of any book",
    ];
  }
}
