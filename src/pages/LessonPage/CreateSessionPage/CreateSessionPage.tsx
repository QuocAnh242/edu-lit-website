import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { useToast } from '@/components/ui/use-toast';
import {
  addSessionToLesson,
  generateId,
  getLessonById
} from '@/utils/lesson-storage';

export default function CreateSessionPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slotNumber, setSlotNumber] = useState<number>(1);
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        description:
          'At least one complete lesson context (with main title and subsections) is required',
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
        description:
          'At least one complete activity (with at least one step and expected outcomes) is required',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Uniqueness check: Slot+Week must be unique within a lesson
      const lesson = getLessonById(lessonId || '');
      const isDuplicate = (lesson?.sessions || []).some((s) => {
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

      // Create new session object with AlternativeLessonPlan structure
      const newSession = {
        id: generateId('session'),
        title: title.trim(),
        description: description.trim(),
        duration: durationString,
        createdAt: new Date().toISOString(),
        lessonPlans: [], // Empty standard lesson plans
        alternativeLessonPlans: [
          {
            id: generateId('alt-lp'),
            title: title.trim(),
            week: 0, // Can be set later
            lessonNumber: 0, // Can be set later
            period: 0, // Can be set later
            createdAt: new Date().toISOString(),
            lessonContexts: validContexts,
            activities: validActivities
          }
        ]
      };

      // Save to localStorage
      addSessionToLesson(lessonId || '', newSession);

      // Mock delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: 'Success',
        description: 'Session created successfully!',
        className: 'bg-green-50 border-green-200'
      });

      // Navigate back to lessons list
      navigate('/lessons');
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create session. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold text-purple-600">
            <BookOpen className="h-10 w-10" />
            Create New Session
          </h1>
          <p className="text-lg text-gray-600">
            Create a new session (curriculum) for this lesson
          </p>
        </div>

        {/* Create Form */}
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
                  💡 <strong>Format Guide:</strong> Use the standard lesson plan
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
                        💡 Fill in details for each step of teacher and student
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
                        💡 Describe learning outcomes and products that students
                        will achieve
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-700">
                  💡 <strong>Guidance:</strong> Each activity needs both parts:
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
                  onClick={() => navigate('/lessons')}
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
                  {isSubmitting ? 'Creating...' : 'Create Session'}
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
                      Slot {slotNumber}, Week {weekNumber}
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
                                  <div key={sub.id} className="ml-4">
                                    <div className="text-sm font-semibold text-blue-700">
                                      {sub.title}
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-xs text-blue-600">
                                      {sub.content}
                                    </p>
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
                    a.step4.trim()
                ) && (
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-slate-500">
                      Activities Preview:
                    </h4>
                    <div className="space-y-4">
                      {activities
                        .filter(
                          (a) =>
                            a.step1.trim() ||
                            a.step2.trim() ||
                            a.step3.trim() ||
                            a.step4.trim()
                        )
                        .map((activity, index) => (
                          <div
                            key={activity.id}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="mb-3">
                              <div className="text-sm font-semibold text-slate-800">
                                Activity {index + 1}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                              {/* Teacher-Student Activities Preview */}
                              <div className="rounded border border-blue-200 bg-blue-50 p-3">
                                <div className="mb-2 text-xs font-semibold text-blue-800">
                                  TEACHER-STUDENT ACTIVITIES:
                                </div>
                                <div className="space-y-2">
                                  {activity.step1 && (
                                    <div>
                                      <div className="text-xs font-semibold text-blue-700">
                                        Step 1: Teacher assigns tasks
                                      </div>
                                      <p className="line-clamp-2 text-xs text-blue-600">
                                        {activity.step1}
                                      </p>
                                    </div>
                                  )}
                                  {activity.step2 && (
                                    <div>
                                      <div className="text-xs font-semibold text-blue-700">
                                        Step 2: Students discuss and complete
                                        tasks
                                      </div>
                                      <p className="line-clamp-2 text-xs text-blue-600">
                                        {activity.step2}
                                      </p>
                                    </div>
                                  )}
                                  {activity.step3 && (
                                    <div>
                                      <div className="text-xs font-semibold text-blue-700">
                                        Step 3: Report results and discuss
                                      </div>
                                      <p className="line-clamp-2 text-xs text-blue-600">
                                        {activity.step3}
                                      </p>
                                    </div>
                                  )}
                                  {activity.step4 && (
                                    <div>
                                      <div className="text-xs font-semibold text-blue-700">
                                        Step 4: Evaluate task completion results
                                      </div>
                                      <p className="line-clamp-2 text-xs text-blue-600">
                                        {activity.step4}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Expected Outcomes Preview */}
                              {activity.expectedOutcome && (
                                <div className="rounded border border-green-200 bg-green-50 p-3">
                                  <div className="mb-2 text-xs font-semibold text-green-800">
                                    EXPECTED OUTCOMES:
                                  </div>
                                  <p className="line-clamp-6 text-xs text-green-700">
                                    {activity.expectedOutcome}
                                  </p>
                                </div>
                              )}
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
