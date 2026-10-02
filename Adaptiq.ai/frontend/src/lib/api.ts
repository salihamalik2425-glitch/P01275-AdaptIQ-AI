const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export type ChatResponse = {
  answer: string;
  source: "ai";
  student_id: string;
};

export type LearningTwin = {
  student_id: string;
  learning_style: string;
  explanation_style: string;
  confidence_score: number;
  strong_topics: string[];
  weak_topics: string[];
  recurring_mistakes: string[];
  updated_at: string;
};

export type ProgressResponse = {
  quizzes_completed: number;
  average_score: number;
  topics_studied: number;
  learning_streak: number;
};

export type HistoryEntry = {
  id: string;
  activity_type: string;
  topic: string | null;
  performance: number | null;
  created_at: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

export type QuizResponse = {
  topic: string;
  questions: QuizQuestion[];
};

export type QuizSubmitResponse = {
  result_id: string;
  score: number;
  total_questions: number;
  learning_twin: LearningTwin;
};

type ApiError = {
  code?: string;
  message?: string;
};

const STUDENT_ID = process.env.NEXT_PUBLIC_STUDENT_ID ?? "development-student";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  let payload: T | ApiError;

  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error((payload as ApiError).message ?? "AdaptIQ could not complete this request.");
  }

  return payload as T;
}

export function getStudentId(): string {
  return STUDENT_ID;
}

export async function getLearningTwin(studentId = STUDENT_ID): Promise<LearningTwin> {
  return request(`/api/learning-twin?student_id=${encodeURIComponent(studentId)}`);
}

export async function getProgress(studentId = STUDENT_ID): Promise<ProgressResponse> {
  return request(`/api/progress?student_id=${encodeURIComponent(studentId)}`);
}

export async function getHistory(studentId = STUDENT_ID): Promise<HistoryEntry[]> {
  const response = await request<{ entries: HistoryEntry[] }>(
    `/api/history?student_id=${encodeURIComponent(studentId)}`,
  );
  return response.entries;
}

export async function generateQuiz(
  topic: string,
  difficulty: "easy" | "medium" | "hard",
  numberOfQuestions: 5 | 10,
  studentId = STUDENT_ID,
): Promise<QuizResponse> {
  return request("/api/quiz/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic,
      difficulty,
      number_of_questions: numberOfQuestions,
      student_id: studentId,
    }),
  });
}

export async function submitQuiz(
  topic: string,
  totalQuestions: number,
  correctAnswers: number,
  mistakes: string[],
  studentId = STUDENT_ID,
): Promise<QuizSubmitResponse> {
  return request("/api/quiz/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      mistakes,
      student_id: studentId,
    }),
  });
}

export async function askAdaptIQ(
  question: string,
  studentId = STUDENT_ID,
): Promise<ChatResponse> {
  return request("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, student_id: studentId }),
  });
}
