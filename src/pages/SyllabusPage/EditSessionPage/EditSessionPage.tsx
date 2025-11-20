import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  BookOpen,
  Save,
  Plus,
  Trash2,
  FileText,
  Activity
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getSessionById,
  updateSession,
  UpdateSessionRequest
} from '@/services/session.api';
import {
  createLessonContext,
  CreateLessonContextRequest
} from '@/services/lessoncontext.api';
import { createActivity, CreateActivityRequest } from '@/services/activity.api';
import { toast as sonnerToast } from 'sonner';

export default function EditSessionPage() {
  const navigate = useNavigate();
  const { lessonId, sessionId } = useParams();

  // Form state - theo đúng API structure
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch session data
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      console.log('🔍 [EditSessionPage] Fetching session:', sessionId);
      const result = await getSessionById(sessionId);
      console.log('📊 [EditSessionPage] Session data:', result);
      return result;
    },
    enabled: !!sessionId
  });

  const session = sessionData?.data;

  // Load session data into form
  useEffect(() => {
    if (session) {
      setTitle(session.title || '');
      setDescription(session.description || '');
      setPosition(session.position || 0);
      setDurationMinutes(session.durationMinutes || 45);
    }
  }, [session]);

  // Lesson Contexts (lesson_context table) - 3 level structure
  const [lessonContexts, setLessonContexts] = useState([
    {
      id: 1,
      mainTitle: 'I. MỤC TIÊU', // Level 1
      subSections: [
        { id: 1, title: '1. Kiến thức:', content: '' },
        { id: 2, title: '2. Năng lực:', content: '' },
        { id: 3, title: '3. Phẩm chất:', content: '' }
      ]
    },
    {
      id: 2,
      mainTitle: 'II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU', // Level 1
      subSections: [
        { id: 1, title: '1. Chuẩn bị của giáo viên:', content: '' },
        { id: 2, title: '2. Chuẩn bị của học sinh:', content: '' }
      ]
    },
    {
      id: 3,
      mainTitle: 'III. TIẾN TRÌNH CÁC HOẠT ĐỘNG DẠY HỌC', // Level 1
      subSections: [
        { id: 1, title: 'A. HOẠT ĐỘNG KHỞI ĐỘNG', content: '' },
        { id: 2, title: 'B. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI', content: '' }
      ]
    }
  ]);

  // Activities (activity table) - 2 column structure with fixed steps
  const [activities, setActivities] = useState([
    {
      id: 1,
      step1: '', // Bước 1: GV chuyển giao nhiệm vụ
      step2: '', // Bước 2: HS trao đổi thảo luận, thực hiện nhiệm vụ
      step3: '', // Bước 3: Báo cáo kết quả hoạt động và thảo luận
      step4: '', // Bước 4: Đánh giá kết quả thực hiện nhiệm vụ
      expectedOutcome: ''
    }
  ]);

  // Update lesson context main title
  const updateMainTitle = (id: number, value: string) => {
    setLessonContexts(
      lessonContexts.map((lc) =>
        lc.id === id ? { ...lc, mainTitle: value } : lc
      )
    );
  };

  // Update lesson context subsection
  const updateSubSection = (
    mainId: number,
    subId: number,
    field: 'title' | 'content',
    value: string
  ) => {
    setLessonContexts(
      lessonContexts.map((lc) =>
        lc.id === mainId
          ? {
              ...lc,
              subSections: lc.subSections.map((sub) =>
                sub.id === subId ? { ...sub, [field]: value } : sub
              )
            }
          : lc
      )
    );
  };

  // Add new subsection
  const addSubSection = (mainId: number) => {
    const newSubId =
      Math.max(
        ...(lessonContexts
          .find((lc) => lc.id === mainId)
          ?.subSections.map((s) => s.id) || [0]),
        0
      ) + 1;
    setLessonContexts(
      lessonContexts.map((lc) =>
        lc.id === mainId
          ? {
              ...lc,
              subSections: [
                ...lc.subSections,
                { id: newSubId, title: '', content: '' }
              ]
            }
          : lc
      )
    );
  };

  // Remove subsection
  const removeSubSection = (mainId: number, subId: number) => {
    setLessonContexts(
      lessonContexts.map((lc) =>
        lc.id === mainId
          ? {
              ...lc,
              subSections: lc.subSections.filter((sub) => sub.id !== subId)
            }
          : lc
      )
    );
  };

  // Add new activity
  const addActivity = () => {
    const newId = Math.max(...activities.map((a) => a.id), 0) + 1;
    setActivities([
      ...activities,
      {
        id: newId,
        step1: '',
        step2: '',
        step3: '',
        step4: '',
        expectedOutcome: ''
      }
    ]);
  };

  // Remove activity
  const removeActivity = (id: number) => {
    if (activities.length > 1) {
      setActivities(activities.filter((a) => a.id !== id));
    }
  };

  // Update activity
  const updateActivity = (
    id: number,
    field: 'step1' | 'step2' | 'step3' | 'step4' | 'expectedOutcome',
    value: string
  ) => {
    setActivities(
      activities.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      sonnerToast.error('Session title is required');
      return;
    }

    // Validate Position
    if (position < 0) {
      sonnerToast.error('Position must be greater than or equal to 0');
      return;
    }

    // Validate Duration Minutes (1 tiết học tối thiểu 30 phút)
    if (durationMinutes < 30) {
      sonnerToast.error(
        'Duration must be at least 30 minutes (minimum for one class period)'
      );
      return;
    }

    if (durationMinutes > 180) {
      sonnerToast.error('Duration cannot exceed 180 minutes (3 hours maximum)');
      return;
    }

    // Validate lesson contexts
    const validContexts = lessonContexts.filter(
      (lc) =>
        lc.mainTitle.trim() &&
        lc.subSections.some((sub) => sub.title.trim() && sub.content.trim())
    );
    if (validContexts.length === 0) {
      sonnerToast.error('At least one complete lesson context is required');
      return;
    }

    // Validate activities
    const validActivities = activities.filter(
      (a) =>
        (a.step1.trim() ||
          a.step2.trim() ||
          a.step3.trim() ||
          a.step4.trim()) &&
        a.expectedOutcome.trim()
    );
    if (validActivities.length === 0) {
      sonnerToast.error('At least one complete activity is required');
      return;
    }

    setIsSubmitting(true);
    sonnerToast.loading(
      'Updating session with lesson contexts and activities...'
    );

    try {
      // 1. Update Session first
      const sessionData: UpdateSessionRequest = {
        title: title.trim(),
        description: description.trim(),
        position: position,
        durationMinutes: durationMinutes
      };

      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      await updateSession(sessionId, sessionData);
      sonnerToast.success('Session updated! Updating lesson contexts...');

      // Wait for CQRS event propagation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 2. Create/Update Lesson Contexts (for now, we'll create new ones)
      // TODO: In the future, implement proper update logic with existing context IDs
      const createdContextIds: string[] = [];
      for (let i = 0; i < validContexts.length; i++) {
        const context = validContexts[i];

        const contextData: CreateLessonContextRequest = {
          sessionId: sessionId,
          parentLessonId: undefined,
          lessonTitle: context.mainTitle,
          lessonContent: context.subSections
            .map((sub) => `${sub.title} ${sub.content}`)
            .join('\n\n'),
          position: i + 1,
          level: 1
        };

        const contextResponse = await createLessonContext(contextData);
        if (contextResponse.data) {
          createdContextIds.push(contextResponse.data);
        }

        // Small delay between context creations
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      sonnerToast.success(
        `${createdContextIds.length} lesson contexts updated! Updating activities...`
      );

      // Wait for CQRS event propagation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. Create/Update Activities (link to first lesson context)
      const firstContextId = createdContextIds[0];
      if (firstContextId) {
        for (let i = 0; i < validActivities.length; i++) {
          const activity = validActivities[i];

          const teacherStudentActivities = [
            activity.step1 && `Step 1: ${activity.step1}`,
            activity.step2 && `Step 2: ${activity.step2}`,
            activity.step3 && `Step 3: ${activity.step3}`,
            activity.step4 && `Step 4: ${activity.step4}`
          ]
            .filter(Boolean)
            .join('\n\n');

          const activityData: CreateActivityRequest = {
            sessionId: sessionId,
            title: `Activity ${i + 1}`,
            description: `Teacher-Student Activities: ${teacherStudentActivities}\n\nExpected Outcomes: ${activity.expectedOutcome}`,
            activityType: 'LESSON_ACTIVITY',
            content: teacherStudentActivities,
            points: undefined,
            position: i + 1,
            isRequired: true
          };

          await createActivity(activityData);

          // Small delay between activity creations
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      sonnerToast.success(
        '🎉 Session, lesson contexts, and activities updated successfully!'
      );

      // Navigate back to sessions page
      navigate(`/course/${lessonId}/sessions`);
    } catch (error) {
      console.error('Error updating session:', error);
      sonnerToast.error('Failed to update session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/course/${lessonId}/sessions`)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sessions
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold text-purple-600">
            <BookOpen className="h-10 w-10" />
            Edit Session
          </h1>
          <p className="text-lg text-gray-600">
            Update session information and content
          </p>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Session Information */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardTitle className="text-2xl">Session Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Session Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">
                  Session Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Session 1: Historical Context & Literary Characteristics of 1945–1975 Period"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base"
                  required
                />
                <p className="text-sm text-slate-500">
                  Enter a descriptive title for this session
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-base font-semibold"
                >
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide a brief overview of what this session covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="text-base"
                  required
                />
                <p className="text-sm text-slate-500">
                  Describe the content and objectives of this session
                </p>
              </div>

              {/* Position and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-base font-semibold">
                    Position *
                  </Label>
                  <Input
                    id="position"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={position}
                    onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
                    className="text-base"
                    required
                  />
                  <p className="text-sm text-slate-500">
                    Order of session in the course (0 = first session)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="durationMinutes"
                    className="text-base font-semibold"
                  >
                    Duration (minutes) *
                  </Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="30"
                    max="180"
                    placeholder="45"
                    value={durationMinutes}
                    onChange={(e) =>
                      setDurationMinutes(parseInt(e.target.value) || 45)
                    }
                    className="text-base"
                    required
                  />
                  <p className="text-sm text-slate-500">
                    Standard class period: 30-45 minutes (max 180 minutes)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lesson Contexts */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <FileText className="h-6 w-6" />
                  Lesson Contexts
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {lessonContexts.map((context, index) => (
                <div
                  key={context.id}
                  className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-slate-700">
                      Section {index + 1}
                    </h4>
                  </div>

                  {/* Main Title */}
                  <div className="space-y-2">
                    <Label className="text-base font-bold text-slate-800">
                      Main Title *
                    </Label>
                    <Input
                      placeholder="e.g., I. MỤC TIÊU, II. THIẾT BỊ DẠY HỌC..."
                      value={context.mainTitle}
                      onChange={(e) =>
                        updateMainTitle(context.id, e.target.value)
                      }
                      className="text-base font-semibold"
                    />
                  </div>

                  {/* Subsections */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-slate-700">
                        Subsections *
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSubSection(context.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Subsection
                      </Button>
                    </div>

                    {context.subSections.map((sub, subIndex) => (
                      <div
                        key={sub.id}
                        className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-blue-800">
                            Subsection {subIndex + 1}
                          </h5>
                          {context.subSections.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeSubSection(context.id, sub.id)
                              }
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <Label className="text-sm font-semibold">
                              Title *
                            </Label>
                            <Input
                              placeholder="e.g., 1. Kiến thức:, A. HOẠT ĐỘNG KHỞI ĐỘNG..."
                              value={sub.title}
                              onChange={(e) =>
                                updateSubSection(
                                  context.id,
                                  sub.id,
                                  'title',
                                  e.target.value
                                )
                              }
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-semibold">
                              Content *
                            </Label>
                            <Textarea
                              placeholder="Describe the content for this subsection..."
                              value={sub.content}
                              onChange={(e) =>
                                updateSubSection(
                                  context.id,
                                  sub.id,
                                  'content',
                                  e.target.value
                                )
                              }
                              rows={3}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  <strong>Format Guide:</strong> Use the standard lesson plan
                  structure:
                  <br />• <strong>I. MỤC TIÊU:</strong> Objectives (Knowledge,
                  Skills, Attitudes)
                  <br />• <strong>
                    II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU:
                  </strong>{' '}
                  Teaching equipment and materials
                  <br />•{' '}
                  <strong>III. TIẾN TRÌNH CÁC HOẠT ĐỘNG DẠY HỌC:</strong>{' '}
                  Teaching process (Activities are handled separately)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Activities */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Activity className="h-6 w-6" />
                  Activities
                </CardTitle>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addActivity}
                  className="bg-white/20 hover:bg-white/30"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Activity
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-slate-700">
                      Activity {index + 1}
                    </h4>
                    {activities.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeActivity(activity.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left Column - Teacher-Student Activities */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                        <Label className="text-base font-bold text-blue-800">
                          TEACHER-STUDENT ACTIVITIES *
                        </Label>
                      </div>

                      {/* Step 1 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-blue-700">
                          Step 1: Teacher assigns tasks
                        </Label>
                        <Textarea
                          placeholder="Describe in detail the tasks that the teacher assigns to students..."
                          value={activity.step1}
                          onChange={(e) =>
                            updateActivity(activity.id, 'step1', e.target.value)
                          }
                          rows={3}
                          className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                        />
                      </div>

                      {/* Step 2 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-blue-700">
                          Step 2: Students discuss and complete tasks
                        </Label>
                        <Textarea
                          placeholder="Describe how students complete tasks, group discussions..."
                          value={activity.step2}
                          onChange={(e) =>
                            updateActivity(activity.id, 'step2', e.target.value)
                          }
                          rows={3}
                          className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                        />
                      </div>

                      {/* Step 3 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-blue-700">
                          Step 3: Report results and discuss
                        </Label>
                        <Textarea
                          placeholder="Describe how students report results and discuss..."
                          value={activity.step3}
                          onChange={(e) =>
                            updateActivity(activity.id, 'step3', e.target.value)
                          }
                          rows={3}
                          className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                        />
                      </div>

                      {/* Step 4 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-blue-700">
                          Step 4: Evaluate task completion results
                        </Label>
                        <Textarea
                          placeholder="Describe how the teacher evaluates student results..."
                          value={activity.step4}
                          onChange={(e) =>
                            updateActivity(activity.id, 'step4', e.target.value)
                          }
                          rows={3}
                          className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                        />
                      </div>

                      <p className="text-xs text-blue-600">
                        Fill in details for each step of teacher and student
                        activities
                      </p>
                    </div>

                    {/* Right Column - Expected Outcomes */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-600"></div>
                        <Label className="text-base font-bold text-green-800">
                          EXPECTED OUTCOMES *
                        </Label>
                      </div>
                      <Textarea
                        placeholder="Describe expected products/outcomes...
Example: I/ Overview of Vietnamese Literature from August Revolution 1945-1975:
1. Brief notes on historical, social, cultural context:"
                        value={activity.expectedOutcome}
                        onChange={(e) =>
                          updateActivity(
                            activity.id,
                            'expectedOutcome',
                            e.target.value
                          )
                        }
                        rows={8}
                        className="mt-1 border-green-200 focus:border-green-400 focus:ring-green-200"
                      />
                      <p className="text-xs text-green-600">
                        Describe learning outcomes and products that students
                        will achieve
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-700">
                  <strong>Guidance:</strong> Each activity needs both parts:
                  <br />• <strong>Teacher-Student Activities:</strong> Describe
                  detailed implementation steps
                  <br />• <strong>Expected Outcomes:</strong> Learning outcomes
                  and expected products
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/course/${lessonId}/sessions`)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Updating...' : 'Update Session'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Preview Card */}
        {title && (
          <Card className="mt-8 shadow-lg">
            <CardHeader className="bg-slate-100">
              <CardTitle className="text-lg text-slate-700">Preview</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Session Info */}
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-semibold text-slate-500">
                      Title:
                    </span>
                    <p className="text-lg font-semibold text-slate-800">
                      {title}
                    </p>
                  </div>
                  {description && (
                    <div>
                      <span className="text-sm font-semibold text-slate-500">
                        Description:
                      </span>
                      <p className="text-slate-700">{description}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-semibold text-slate-500">
                      Time:
                    </span>
                    <p className="text-slate-700">
                      Position {position}, Duration {durationMinutes} minutes
                    </p>
                  </div>
                </div>

                {/* Lesson Contexts Preview */}
                {lessonContexts.some((lc) => lc.mainTitle.trim()) && (
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-slate-500">
                      Lesson Contexts:
                    </h4>
                    <div className="space-y-3">
                      {lessonContexts
                        .filter((lc) => lc.mainTitle.trim())
                        .map((context, index) => (
                          <div
                            key={context.id}
                            className="rounded-lg border border-blue-200 bg-blue-50 p-4"
                          >
                            <div className="mb-2 text-base font-bold text-blue-800">
                              {context.mainTitle}
                            </div>
                            <div className="space-y-2">
                              {context.subSections
                                .filter(
                                  (sub) =>
                                    sub.title.trim() && sub.content.trim()
                                )
                                .map((sub, subIndex) => (
                                  <div key={sub.id} className="text-sm">
                                    <span className="font-semibold text-blue-700">
                                      {sub.title}
                                    </span>{' '}
                                    <span className="text-blue-600">
                                      {sub.content}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Activities Preview */}
                {activities.some(
                  (a) =>
                    a.step1.trim() ||
                    a.step2.trim() ||
                    a.step3.trim() ||
                    a.step4.trim() ||
                    a.expectedOutcome.trim()
                ) && (
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-slate-500">
                      Activities:
                    </h4>
                    <div className="space-y-3">
                      {activities
                        .filter(
                          (a) =>
                            a.step1.trim() ||
                            a.step2.trim() ||
                            a.step3.trim() ||
                            a.step4.trim() ||
                            a.expectedOutcome.trim()
                        )
                        .map((activity, index) => (
                          <div
                            key={activity.id}
                            className="rounded-lg border border-green-200 bg-green-50 p-4"
                          >
                            <div className="mb-2 text-base font-bold text-green-800">
                              Activity {index + 1}
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <div className="mb-2 text-sm font-semibold text-green-700">
                                  Teacher-Student Activities:
                                </div>
                                <div className="space-y-1 text-sm text-green-600">
                                  {activity.step1 && (
                                    <div>Step 1: {activity.step1}</div>
                                  )}
                                  {activity.step2 && (
                                    <div>Step 2: {activity.step2}</div>
                                  )}
                                  {activity.step3 && (
                                    <div>Step 3: {activity.step3}</div>
                                  )}
                                  {activity.step4 && (
                                    <div>Step 4: {activity.step4}</div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="mb-2 text-sm font-semibold text-green-700">
                                  Expected Outcomes:
                                </div>
                                <div className="text-sm text-green-600">
                                  {activity.expectedOutcome}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
