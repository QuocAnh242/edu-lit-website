import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  FileText,
  Activity,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getLessonById, updateSession } from '@/utils/lesson-storage';

export default function EditSessionPage() {
  const navigate = useNavigate();
  const { lessonId, sessionId } = useParams();
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slotNumber, setSlotNumber] = useState<number>(1);
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lesson Contexts (lesson_context table) - 3 level structure
  const [lessonContexts, setLessonContexts] = useState([
    {
      id: 1,
      mainTitle: 'I. MỤC TIÊU',
      subSections: [
        { id: 1, title: '1. Kiến thức:', content: '' },
        { id: 2, title: '2. Năng lực:', content: '' },
        { id: 3, title: '3. Phẩm chất:', content: '' }
      ]
    },
    {
      id: 2,
      mainTitle: 'II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU',
      subSections: [
        { id: 1, title: '1. Chuẩn bị của giáo viên:', content: '' },
        { id: 2, title: '2. Chuẩn bị của học sinh:', content: '' }
      ]
    },
    {
      id: 3,
      mainTitle: 'III. TIẾN TRÌNH CÁC HOẠT ĐỘNG DẠY HỌC',
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
      step1: '',
      step2: '',
      step3: '',
      step4: '',
      expectedOutcome: ''
    }
  ]);

  // Load session data from localStorage
  useEffect(() => {
    const fetchSession = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const lesson = getLessonById(lessonId || '');
        const session = lesson?.sessions.find((s) => s.id === sessionId);

        if (!session) {
          throw new Error('Session not found');
        }

        // Set basic info
        setTitle(session.title);
        setDescription(session.description);

        // Parse duration if it contains slot/week information ("Slot X, Week Y")
        const durationStr = session.duration || '';
        const slotNumMatch = durationStr.match(/Slot\s*(\d+)/i);
        const weekNumMatch = durationStr.match(/Week\s*(\d+)/i);
        if (slotNumMatch) setSlotNumber(parseInt(slotNumMatch[1]) || 1);
        if (weekNumMatch) setWeekNumber(parseInt(weekNumMatch[1]) || 1);

        // Load alternative lesson plans if exists
        if (
          session.alternativeLessonPlans &&
          session.alternativeLessonPlans.length > 0
        ) {
          const plan = session.alternativeLessonPlans[0];
          setLessonContexts(plan.lessonContexts);
          setActivities(plan.activities);
        }
      } catch (error) {
        console.error('Error loading session:', error);
        toast({
          title: 'Error',
          description: 'Failed to load session data',
          variant: 'destructive'
        });
        navigate('/lessons');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [lessonId, sessionId, navigate, toast]);

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

  // Add subsection to lesson context
  const addSubSection = (mainId: number) => {
    setLessonContexts(
      lessonContexts.map((lc) =>
        lc.id === mainId
          ? {
              ...lc,
              subSections: [
                ...lc.subSections,
                { id: Date.now(), title: '', content: '' }
              ]
            }
          : lc
      )
    );
  };

  // Remove subsection from lesson context
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

  // Update activity step
  const updateActivity = (id: number, field: string, value: string) => {
    setActivities(
      activities.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  // Add new activity
  const addActivity = () => {
    setActivities([
      ...activities,
      {
        id: Date.now(),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Session title is required',
        variant: 'destructive'
      });
      return;
    }

    // Validate slot/week numbers
    if (slotNumber < 1 || weekNumber < 1) {
      toast({
        title: 'Error',
        description: 'Slot and week numbers must be positive',
        variant: 'destructive'
      });
      return;
    }

    // Validate lesson contexts
    const validContexts = lessonContexts.filter(
      (lc) =>
        lc.mainTitle.trim() &&
        lc.subSections.some((sub) => sub.title.trim() && sub.content.trim())
    );
    if (validContexts.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one complete lesson context is required',
        variant: 'destructive'
      });
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
      toast({
        title: 'Error',
        description: 'At least one complete activity is required',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current lesson
      const lesson = getLessonById(lessonId || '');
      const currentSession = lesson?.sessions.find((s) => s.id === sessionId);

      if (!currentSession) {
        throw new Error('Session not found');
      }

      // Uniqueness check: Slot+Week must be unique within a lesson (excluding current)
      const isDuplicate = (lesson?.sessions || [])
        .filter((s) => s.id !== sessionId)
        .some((s) => {
          const d = s.duration || '';
          const mSlot = d.match(/Slot\s*(\d+)/i);
          const mWeek = d.match(/Week\s*(\d+)/i);
          const slotVal = mSlot ? parseInt(mSlot[1]) : undefined;
          const weekVal = mWeek ? parseInt(mWeek[1]) : undefined;
          return slotVal === slotNumber && weekVal === weekNumber;
        });

      if (isDuplicate) {
        toast({
          title: 'Duplicate Slot/Week',
          description:
            'Another session in this lesson already uses this Slot and Week.',
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }

      // Create duration string from slot/week information
      const durationString = `Slot ${slotNumber}, Week ${weekNumber}`;

      // Update session object
      const updatedSession = {
        ...currentSession,
        title: title.trim(),
        description: description.trim(),
        duration: durationString,
        alternativeLessonPlans: [
          {
            id:
              currentSession.alternativeLessonPlans?.[0]?.id ||
              `alt-lp-${Date.now()}`,
            title: title.trim(),
            week: currentSession.alternativeLessonPlans?.[0]?.week || 0,
            lessonNumber:
              currentSession.alternativeLessonPlans?.[0]?.lessonNumber || 0,
            period: currentSession.alternativeLessonPlans?.[0]?.period || 0,
            createdAt:
              currentSession.alternativeLessonPlans?.[0]?.createdAt ||
              new Date().toISOString(),
            lessonContexts: validContexts,
            activities: validActivities
          }
        ]
      };

      // Save to localStorage
      updateSession(lessonId || '', sessionId || '', updatedSession);

      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: 'Success',
        description: 'Session updated successfully!',
        className: 'bg-green-50 border-green-200'
      });

      navigate('/lessons');
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to update session. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="mb-6 h-10 w-32" />
          <Skeleton className="mb-8 h-12 w-96" />
          <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/lessons')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lessons
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold text-green-600">
            <FileText className="h-10 w-10" />
            Edit Session
          </h1>
          <p className="text-lg text-gray-600">
            Update session information and teaching content
          </p>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
              <CardTitle className="text-2xl">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Session Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">
                  Session Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Proverbs about nature and labor"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-base font-semibold"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide an overview of this session..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="text-base"
                />
              </div>

              {/* Slot and Week */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="slotNumber"
                    className="text-base font-semibold"
                  >
                    Slot Number *
                  </Label>
                  <Input
                    id="slotNumber"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={slotNumber}
                    onChange={(e) =>
                      setSlotNumber(parseInt(e.target.value) || 1)
                    }
                    className="text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="weekNumber"
                    className="text-base font-semibold"
                  >
                    Week Number *
                  </Label>
                  <Input
                    id="weekNumber"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={weekNumber}
                    onChange={(e) =>
                      setWeekNumber(parseInt(e.target.value) || 1)
                    }
                    className="text-base"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lesson Contexts Section */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <CardTitle className="text-2xl">Lesson Content</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {lessonContexts.map((context, ctxIdx) => (
                <div
                  key={context.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="mb-4">
                    <Label className="text-base font-semibold">
                      Main Title {ctxIdx + 1}
                    </Label>
                    <Input
                      value={context.mainTitle}
                      onChange={(e) =>
                        updateMainTitle(context.id, e.target.value)
                      }
                      className="mt-2 text-base font-semibold"
                      placeholder="e.g., I. OBJECTIVES"
                    />
                  </div>

                  <div className="space-y-4">
                    {context.subSections.map((sub) => (
                      <div
                        key={sub.id}
                        className="rounded-lg border border-slate-300 bg-white p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <Input
                            value={sub.title}
                            onChange={(e) =>
                              updateSubSection(
                                context.id,
                                sub.id,
                                'title',
                                e.target.value
                              )
                            }
                            className="text-base font-medium"
                            placeholder="Sub-section title"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSubSection(context.id, sub.id)}
                            className="ml-2 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={sub.content}
                          onChange={(e) =>
                            updateSubSection(
                              context.id,
                              sub.id,
                              'content',
                              e.target.value
                            )
                          }
                          rows={4}
                          placeholder="Detailed content..."
                          className="text-base"
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addSubSection(context.id)}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Sub-section
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activities Section */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-6 w-6" />
                  <CardTitle className="text-2xl">
                    Teaching Activities
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addActivity}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Activity
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {activities.map((activity, actIdx) => (
                <div
                  key={activity.id}
                  className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-6"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-indigo-900">
                      Activity {actIdx + 1}
                    </h3>
                    {activities.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeActivity(activity.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left Column - 4 Steps */}
                    <div className="space-y-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                        <h4 className="text-base font-bold text-blue-800">
                          TEACHER-STUDENT ACTIVITIES
                        </h4>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-blue-700">
                          Step 1: Teacher assigns tasks
                        </Label>
                        <Textarea
                          value={activity.step1}
                          onChange={(e) =>
                            updateActivity(activity.id, 'step1', e.target.value)
                          }
                          rows={3}
                          placeholder="Describe the tasks teacher assigns to students..."
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-blue-700">
                          Step 2: Students complete tasks
                        </Label>
                        <Textarea
                          value={activity.step2}
                          onChange={(e) =>
                            updateActivity(activity.id, 'step2', e.target.value)
                          }
                          rows={3}
                          placeholder="Describe how students complete tasks..."
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-blue-700">
                          Step 3: Report and discuss
                        </Label>
                        <Textarea
                          value={activity.step3}
                          onChange={(e) =>
                            updateActivity(activity.id, 'step3', e.target.value)
                          }
                          rows={3}
                          placeholder="Describe how students report results..."
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-blue-700">
                          Step 4: Conclusion and evaluation
                        </Label>
                        <Textarea
                          value={activity.step4}
                          onChange={(e) =>
                            updateActivity(activity.id, 'step4', e.target.value)
                          }
                          rows={3}
                          placeholder="Describe how teacher concludes..."
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Right Column - Expected Outcomes */}
                    <div className="space-y-3">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-600"></div>
                        <h4 className="text-base font-bold text-green-800">
                          EXPECTED OUTCOMES *
                        </h4>
                      </div>
                      <Textarea
                        value={activity.expectedOutcome}
                        onChange={(e) =>
                          updateActivity(
                            activity.id,
                            'expectedOutcome',
                            e.target.value
                          )
                        }
                        rows={20}
                        placeholder="Describe products/results students achieve after activities..."
                        className="text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/lessons')}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Update Session
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
