// Mock data for Vietnamese Literature Lessons based on real curriculum

// Alternative lesson plan structures (matching CreateSessionPage format)
export interface LessonContext {
  id: number;
  mainTitle: string;
  subSections: Array<{
    id: number;
    title: string;
    content: string;
  }>;
}

export interface ActivityStep {
  id: number;
  step1: string; // GV chuyển giao nhiệm vụ
  step2: string; // HS thực hiện nhiệm vụ
  step3: string; // Báo cáo kết quả
  step4: string; // Đánh giá
  expectedOutcome: string;
}

export interface AlternativeLessonPlan {
  id: string;
  title: string;
  week: number;
  lessonNumber: number;
  period: number;
  createdAt: string;
  lessonContexts: LessonContext[];
  activities: ActivityStep[];
}

// Standard lesson plan structure
export interface LessonPlan {
  id: string;
  title: string;
  week: number;
  lessonNumber: number;
  period: number;
  objectives: {
    knowledge: string[];
    skills: string[];
    qualities: string[];
  };
  teachingMaterials: string[];
  activities: {
    warmUp: {
      title: string;
      duration: number;
      content: string;
      product: string;
    };
    newKnowledge: {
      title: string;
      duration: number;
      steps: Array<{
        name: string;
        content: string;
        expectedOutput: string;
      }>;
    };
    practice: {
      title: string;
      duration: number;
      content: string;
    };
    application: {
      title: string;
      duration: number;
      content: string;
    };
  };
  keyTakeaways: string[];
  homework: string[];
  createdAt: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  duration: string;
  createdAt: string;
  lessonPlans: LessonPlan[];
  alternativeLessonPlans?: AlternativeLessonPlan[]; // Optional: for CreateSessionPage format
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  grade: string;
  semester: string;
  subject: string;
  createdAt: string;
  sessions: Session[];
}

// Empty mock lessons - User will create data through UI
export const mockLessons: Lesson[] = [];

/* 
  To create new lessons, use the Create Lesson/Session buttons in the UI.
  Data will be stored and managed through the application.
  
  Structure:
  - Lesson (title, grade, semester, subject)
    └── Session (title, duration, description)
        └── Lesson Plan (objectives, activities, homework)
           OR Alternative Lesson Plan (lessonContexts, 4-step activities)
*/

// Helper functions for accessing mock data
export const getMockLessonById = (id: string): Lesson | undefined => {
  return mockLessons.find((lesson) => lesson.id === id);
};

export const getMockSessionById = (lessonId: string, sessionId: string) => {
  const lesson = getMockLessonById(lessonId);
  return lesson?.sessions.find((session) => session.id === sessionId);
};

export const getMockLessonPlanById = (
  lessonId: string,
  sessionId: string,
  planId: string
) => {
  const session = getMockSessionById(lessonId, sessionId);
  return session?.lessonPlans.find((plan) => plan.id === planId);
};
