import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Plus, Trash2, FileText, Activity, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SessionDto, UpdateSessionRequest } from '@/services/session.api';
import {
  CreateLessonContextRequest,
  CreateSubsectionRequest
} from '@/services/lessoncontext.api';
import { CreateActivityRequest } from '@/services/activity.api';

interface SessionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionDto | null;
  onSave: (
    sessionData: UpdateSessionRequest,
    lessonContexts: CreateLessonContextRequest[],
    activities: { [key: string]: CreateActivityRequest[] }
  ) => void;
  isLoading?: boolean;
}

export default function SessionEditDialog({
  open,
  onOpenChange,
  session,
  onSave,
  isLoading = false
}: SessionEditDialogProps) {
  // Session form state
  const [sessionForm, setSessionForm] = useState<UpdateSessionRequest>({
    title: '',
    description: '',
    position: 0,
    durationMinutes: undefined
  });

  // LessonContexts state
  const [lessonContexts, setLessonContexts] = useState<
    CreateLessonContextRequest[]
  >([]);

  // Activities state (keyed by temporary lessonContext index)
  const [activities, setActivities] = useState<{
    [key: string]: CreateActivityRequest[];
  }>({});

  // Initialize form when session changes
  useEffect(() => {
    if (session) {
      setSessionForm({
        title: session.title,
        description: session.description,
        position: session.position,
        durationMinutes: session.durationMinutes
      });

      // Initialize with empty lesson contexts if none exist
      if (lessonContexts.length === 0) {
        addLessonContext();
      }
    }
  }, [session]);

  // LessonContext handlers
  const addLessonContext = () => {
    const newContext: CreateLessonContextRequest = {
      sessionId: session?.id || '',
      lessonTitle: '',
      lessonContent: '',
      position: lessonContexts.length,
      level: 1
    };

    console.log('➕ [SessionEditDialog] Adding lesson context:', newContext);

    const newContexts = [...lessonContexts, newContext];
    setLessonContexts(newContexts);

    // Initialize activities for this context
    const contextKey = (newContexts.length - 1).toString();
    setActivities((prev) => ({
      ...prev,
      [contextKey]: []
    }));
  };

  const updateLessonContext = (
    index: number,
    field: keyof CreateLessonContextRequest,
    value: any
  ) => {
    const updated = [...lessonContexts];
    updated[index] = { ...updated[index], [field]: value };
    setLessonContexts(updated);
  };

  const removeLessonContext = (index: number) => {
    const updated = lessonContexts.filter((_, i) => i !== index);
    setLessonContexts(updated);

    // Remove activities for this context
    const contextKey = index.toString();
    const { [contextKey]: removed, ...remainingActivities } = activities;
    setActivities(remainingActivities);
  };

  // Activity handlers
  const addActivity = (lessonContextIndex: number) => {
    const contextKey = lessonContextIndex.toString();
    const newActivity: CreateActivityRequest = {
      sessionId: session?.id || '',
      title: '',
      description: '',
      activityType: 'lesson',
      content: '',
      points: 0,
      position: activities[contextKey]?.length || 0,
      isRequired: false
    };

    console.log(
      '🎯 [SessionEditDialog] Adding activity for context',
      lessonContextIndex,
      ':',
      newActivity
    );

    setActivities((prev) => ({
      ...prev,
      [contextKey]: [...(prev[contextKey] || []), newActivity]
    }));
  };

  const updateActivity = (
    lessonContextIndex: number,
    activityIndex: number,
    field: keyof CreateActivityRequest,
    value: any
  ) => {
    const contextKey = lessonContextIndex.toString();
    const updated = [...(activities[contextKey] || [])];
    updated[activityIndex] = { ...updated[activityIndex], [field]: value };

    setActivities((prev) => ({
      ...prev,
      [contextKey]: updated
    }));
  };

  const removeActivity = (
    lessonContextIndex: number,
    activityIndex: number
  ) => {
    const contextKey = lessonContextIndex.toString();
    const updated = (activities[contextKey] || []).filter(
      (_, i) => i !== activityIndex
    );

    setActivities((prev) => ({
      ...prev,
      [contextKey]: updated
    }));
  };

  const handleSave = () => {
    // Validation
    if (!sessionForm.title?.trim()) {
      toast.error('Session title is required');
      return;
    }

    // Validate Position
    if (sessionForm.position === undefined || sessionForm.position < 0) {
      toast.error('Position must be greater than or equal to 0');
      return;
    }

    // Validate Duration Minutes (nếu có)
    if (
      sessionForm.durationMinutes !== undefined &&
      sessionForm.durationMinutes !== null
    ) {
      if (sessionForm.durationMinutes < 30) {
        toast.error(
          'Duration must be at least 30 minutes (minimum for one class period)'
        );
        return;
      }

      if (sessionForm.durationMinutes > 180) {
        toast.error('Duration cannot exceed 180 minutes (3 hours maximum)');
        return;
      }
    }

    console.log('🔄 [SessionEditDialog] Saving session data:', {
      sessionForm,
      lessonContexts,
      activities
    });

    onSave(sessionForm, lessonContexts, activities);
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset form
    setLessonContexts([]);
    setActivities({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit Session with Lesson Contexts & Activities
          </DialogTitle>
          <DialogDescription>
            Edit session information and manage lesson contexts with their
            activities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Session Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session-title">Title *</Label>
                  <Input
                    id="session-title"
                    value={sessionForm.title}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, title: e.target.value })
                    }
                    placeholder="Enter session title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-position">Position</Label>
                  <Input
                    id="session-position"
                    type="number"
                    min="0"
                    value={sessionForm.position}
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        position: parseInt(e.target.value) || 0
                      })
                    }
                  />
                  <p className="text-sm text-slate-500">
                    Order of session in the course (0 = first session)
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-description">Description</Label>
                <Textarea
                  id="session-description"
                  value={sessionForm.description}
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      description: e.target.value
                    })
                  }
                  placeholder="Enter session description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-duration">Duration (minutes)</Label>
                <Input
                  id="session-duration"
                  type="number"
                  min="30"
                  max="180"
                  value={sessionForm.durationMinutes || ''}
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      durationMinutes: parseInt(e.target.value) || undefined
                    })
                  }
                  placeholder="45 (minutes)"
                />
                <p className="text-sm text-slate-500">
                  Standard class period: 30-45 minutes (max 180 minutes)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lesson Contexts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Lesson Contexts
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLessonContext}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Context
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lessonContexts.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p>
                    No lesson contexts yet. Click "Add Context" to get started.
                  </p>
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-4">
                  {lessonContexts.map((context, contextIndex) => (
                    <AccordionItem
                      key={contextIndex}
                      value={`context-${contextIndex}`}
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{contextIndex + 1}</Badge>
                          <span>
                            {context.lessonTitle ||
                              `Lesson Context ${contextIndex + 1}`}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        {/* Lesson Context Form */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                              value={context.lessonTitle}
                              onChange={(e) =>
                                updateLessonContext(
                                  contextIndex,
                                  'lessonTitle',
                                  e.target.value
                                )
                              }
                              placeholder="Enter context title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Position</Label>
                            <Input
                              type="number"
                              min="0"
                              value={context.position}
                              onChange={(e) =>
                                updateLessonContext(
                                  contextIndex,
                                  'position',
                                  parseInt(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Content</Label>
                          <Textarea
                            value={context.lessonContent}
                            onChange={(e) =>
                              updateLessonContext(
                                contextIndex,
                                'lessonContent',
                                e.target.value
                              )
                            }
                            placeholder="Enter context content"
                            rows={4}
                          />
                        </div>

                        {/* Activities for this Context */}
                        <div className="border-t pt-4">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              <span className="font-medium">Activities</span>
                              <Badge variant="secondary">
                                {activities[contextIndex.toString()]?.length ||
                                  0}
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addActivity(contextIndex)}
                              className="gap-2"
                            >
                              <Plus className="h-3 w-3" />
                              Add Activity
                            </Button>
                          </div>

                          {(activities[contextIndex.toString()] || []).map(
                            (activity, activityIndex) => (
                              <Card key={activityIndex} className="mb-4">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="bg-green-50"
                                      >
                                        Activity #{activityIndex + 1}
                                      </Badge>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        removeActivity(
                                          contextIndex,
                                          activityIndex
                                        )
                                      }
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Activity Title *</Label>
                                    <Input
                                      value={activity.title}
                                      onChange={(e) =>
                                        updateActivity(
                                          contextIndex,
                                          activityIndex,
                                          'title',
                                          e.target.value
                                        )
                                      }
                                      placeholder="Enter activity title"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Activity Type *</Label>
                                      <Input
                                        value={activity.activityType}
                                        onChange={(e) =>
                                          updateActivity(
                                            contextIndex,
                                            activityIndex,
                                            'activityType',
                                            e.target.value
                                          )
                                        }
                                        placeholder="e.g., lesson, exercise, project"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Description</Label>
                                      <Textarea
                                        value={activity.description}
                                        onChange={(e) =>
                                          updateActivity(
                                            contextIndex,
                                            activityIndex,
                                            'description',
                                            e.target.value
                                          )
                                        }
                                        placeholder="Activity description..."
                                        rows={3}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Content</Label>
                                      <Textarea
                                        value={activity.content}
                                        onChange={(e) =>
                                          updateActivity(
                                            contextIndex,
                                            activityIndex,
                                            'content',
                                            e.target.value
                                          )
                                        }
                                        placeholder="Activity content..."
                                        rows={4}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          )}

                          {(activities[contextIndex.toString()]?.length ||
                            0) === 0 && (
                            <div className="rounded-lg border-2 border-dashed border-gray-200 py-6 text-center text-gray-500">
                              <Activity className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                              <p className="text-sm">
                                No activities yet. Click "Add Activity" to
                                create one.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Remove Context Button */}
                        <div className="flex justify-end border-t pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLessonContext(contextIndex)}
                            className="gap-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove Context
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save All Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
