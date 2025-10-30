// LocalStorage utilities for persisting lessons data
import { Lesson } from '@/constants/mock-lessons';

const LESSONS_STORAGE_KEY = 'edu-lit-lessons';

/**
 * Load all lessons from localStorage
 */
export const loadLessonsFromStorage = (): Lesson[] => {
  try {
    const stored = localStorage.getItem(LESSONS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Lesson[];
  } catch (error) {
    console.error('Error loading lessons from localStorage:', error);
    return [];
  }
};

/**
 * Save all lessons to localStorage
 */
export const saveLessonsToStorage = (lessons: Lesson[]): void => {
  try {
    localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(lessons));
  } catch (error) {
    console.error('Error saving lessons to localStorage:', error);
  }
};

/**
 * Add a new lesson
 */
export const addLesson = (lesson: Lesson): Lesson[] => {
  const lessons = loadLessonsFromStorage();
  lessons.push(lesson);
  saveLessonsToStorage(lessons);
  return lessons;
};

/**
 * Update an existing lesson
 */
export const updateLesson = (
  lessonId: string,
  updatedLesson: Lesson
): Lesson[] => {
  const lessons = loadLessonsFromStorage();
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index !== -1) {
    lessons[index] = updatedLesson;
    saveLessonsToStorage(lessons);
  }
  return lessons;
};

/**
 * Delete a lesson
 */
export const deleteLesson = (lessonId: string): Lesson[] => {
  const lessons = loadLessonsFromStorage();
  const filtered = lessons.filter((l) => l.id !== lessonId);
  saveLessonsToStorage(filtered);
  return filtered;
};

/**
 * Get a specific lesson by ID
 */
export const getLessonById = (lessonId: string): Lesson | undefined => {
  const lessons = loadLessonsFromStorage();
  return lessons.find((l) => l.id === lessonId);
};

/**
 * Add a session to a lesson
 */
export const addSessionToLesson = (
  lessonId: string,
  session: Lesson['sessions'][0]
): Lesson[] => {
  const lessons = loadLessonsFromStorage();
  const lesson = lessons.find((l) => l.id === lessonId);

  if (lesson) {
    lesson.sessions.push(session);
    saveLessonsToStorage(lessons);
  }

  return lessons;
};

/**
 * Update a session in a lesson
 */
export const updateSession = (
  lessonId: string,
  sessionId: string,
  updatedSession: Lesson['sessions'][0]
): Lesson[] => {
  const lessons = loadLessonsFromStorage();
  const lesson = lessons.find((l) => l.id === lessonId);

  if (lesson) {
    const sessionIndex = lesson.sessions.findIndex((s) => s.id === sessionId);
    if (sessionIndex !== -1) {
      lesson.sessions[sessionIndex] = updatedSession;
      saveLessonsToStorage(lessons);
    }
  }

  return lessons;
};

/**
 * Delete a session from a lesson
 */
export const deleteSession = (
  lessonId: string,
  sessionId: string
): Lesson[] => {
  const lessons = loadLessonsFromStorage();
  const lesson = lessons.find((l) => l.id === lessonId);

  if (lesson) {
    lesson.sessions = lesson.sessions.filter((s) => s.id !== sessionId);
    saveLessonsToStorage(lessons);
  }

  return lessons;
};

/**
 * Generate a unique ID
 */
export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
