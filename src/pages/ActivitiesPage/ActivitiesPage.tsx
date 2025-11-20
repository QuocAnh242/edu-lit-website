import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  ArrowLeft,
  Activity
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAllActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  ActivityDto,
  CreateActivityRequest,
  UpdateActivityRequest
} from '@/services/activity.api';

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const { lessonContextId } = useParams<{ lessonContextId: string }>();
  const queryClient = useQueryClient();

  // State
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityDto | null>(
    null
  );
  const [activityToDelete, setActivityToDelete] = useState<ActivityDto | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');

  const [activityForm, setActivityForm] = useState<CreateActivityRequest>({
    lessonContextId: lessonContextId || '',
    title: '',
    teacherStudentActivities: '',
    expectedOutcomes: '',
    orderIndex: 1
  });

  // Fetch activities for this lesson context
  const {
    data: activitiesData,
    isLoading: loadingActivities,
    isError: activitiesError
  } = useQuery({
    queryKey: ['activities', lessonContextId, searchTerm],
    queryFn: async () => {
      if (!lessonContextId) throw new Error('Lesson Context ID is required');
      return await getAllActivities({
        pageNumber: 1,
        pageSize: 100,
        lessonContextId: lessonContextId,
        searchTerm: searchTerm || undefined
      });
    },
    enabled: !!lessonContextId
  });

  const activities = useMemo(() => {
    return (activitiesData?.data?.items || []) as ActivityDto[];
  }, [activitiesData?.data?.items]);

  // Mutations
  const createActivityMutation = useMutation({
    mutationFn: async (data: CreateActivityRequest) => {
      return await createActivity(data);
    },
    onSuccess: async () => {
      toast.success('Activity created successfully! ✅');

      // Wait for CQRS event propagation
      await new Promise((resolve) => setTimeout(resolve, 5000));

      await queryClient.refetchQueries({
        queryKey: ['activities'],
        exact: false,
        type: 'active'
      });

      setActivityDialogOpen(false);
      resetActivityForm();
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { message?: string })?.message || 'Failed to create activity';
      toast.error(errorMessage);
    }
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: UpdateActivityRequest;
    }) => {
      return await updateActivity(id, data);
    },
    onSuccess: async () => {
      toast.success('Activity updated successfully! ✅');

      // Wait for CQRS event propagation
      await new Promise((resolve) => setTimeout(resolve, 5000));

      await queryClient.refetchQueries({
        queryKey: ['activities'],
        exact: false,
        type: 'active'
      });

      setActivityDialogOpen(false);
      setEditingActivity(null);
      resetActivityForm();
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { message?: string })?.message || 'Failed to update activity';
      toast.error(errorMessage);
    }
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      return await deleteActivity(activityId);
    },
    onSuccess: async () => {
      toast.success('Activity deleted successfully! 🗑️');

      // Wait for CQRS event propagation
      await new Promise((resolve) => setTimeout(resolve, 5000));

      await queryClient.refetchQueries({
        queryKey: ['activities'],
        exact: false,
        type: 'active'
      });

      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { message?: string })?.message || 'Failed to delete activity';
      toast.error(errorMessage);
    }
  });

  // Handlers
  const handleCreateActivity = () => {
    setEditingActivity(null);
    resetActivityForm();
    setActivityDialogOpen(true);
  };

  const handleEditActivity = (activity: ActivityDto) => {
    setEditingActivity(activity);
    setActivityForm({
      lessonContextId: activity.lessonContextId,
      title: activity.title,
      teacherStudentActivities: activity.teacherStudentActivities,
      expectedOutcomes: activity.expectedOutcomes,
      orderIndex: activity.orderIndex
    });
    setActivityDialogOpen(true);
  };

  const handleDeleteActivity = (activity: ActivityDto) => {
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
  };

  const handleSaveActivity = () => {
    if (!activityForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const dataToSend = {
      ...activityForm,
      lessonContextId: lessonContextId || ''
    };

    if (editingActivity) {
      updateActivityMutation.mutate({
        id: editingActivity.id,
        data: dataToSend
      });
    } else {
      createActivityMutation.mutate(dataToSend);
    }
  };

  const handleDeleteConfirm = () => {
    if (activityToDelete) {
      deleteActivityMutation.mutate(activityToDelete.id);
    }
  };

  const resetActivityForm = () => {
    setActivityForm({
      lessonContextId: lessonContextId || '',
      title: '',
      teacherStudentActivities: '',
      expectedOutcomes: '',
      orderIndex: activities.length + 1
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() =>
              navigate(`/session/${lessonContextId}/lessoncontexts`)
            }
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lesson Contexts
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 flex items-center gap-2 text-4xl font-bold text-green-600">
                <Activity className="h-10 w-10" />
                Activities
              </h1>
              <p className="text-lg text-gray-600">
                Manage teacher-student activities and expected outcomes
              </p>
            </div>
            <Button
              onClick={handleCreateActivity}
              className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600"
            >
              <Plus className="h-5 w-5" />
              Add Activity
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search activities by title or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities Table */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                All Activities
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {activities.length}{' '}
                {activities.length === 1 ? 'Activity' : 'Activities'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingActivities ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activitiesError ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Activity className="mb-4 h-16 w-16 text-red-300" />
                <h3 className="mb-2 text-xl font-semibold text-red-700">
                  Error loading activities
                </h3>
                <p className="mb-4 text-gray-500">
                  An error occurred while loading activities. Please try again.
                </p>
                <Button
                  onClick={() =>
                    queryClient.invalidateQueries({ queryKey: ['activities'] })
                  }
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Activity className="mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 text-xl font-semibold text-gray-700">
                  No activities yet
                </h3>
                <p className="mb-4 text-gray-500">
                  {searchTerm
                    ? 'No activities found matching your search.'
                    : 'Get started by creating your first activity'}
                </p>
                {!searchTerm && (
                  <Button onClick={handleCreateActivity} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Activity
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Teacher-Student Activities</TableHead>
                    <TableHead>Expected Outcomes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((activity: ActivityDto) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Badge variant="outline">
                            #{activity.orderIndex}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {activity.title}
                        </TableCell>
                        <TableCell>
                          <div className="line-clamp-2 max-w-md text-sm text-gray-600">
                            {activity.teacherStudentActivities ||
                              'No activities'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="line-clamp-2 max-w-md text-sm text-gray-600">
                            {activity.expectedOutcomes || 'No outcomes'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {activity.createdAt
                            ? new Date(activity.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditActivity(activity)}
                            >
                              <Edit className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteActivity(activity)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? 'Edit Activity' : 'Create Activity'}
            </DialogTitle>
            <DialogDescription>
              {editingActivity
                ? 'Update the activity information.'
                : 'Create a new activity with teacher-student activities and expected outcomes.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter activity title"
                value={activityForm.title}
                onChange={(e) =>
                  setActivityForm({ ...activityForm, title: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacherStudentActivities">
                  Teacher-Student Activities *
                </Label>
                <Textarea
                  id="teacherStudentActivities"
                  placeholder="Describe detailed implementation steps..."
                  value={activityForm.teacherStudentActivities}
                  onChange={(e) =>
                    setActivityForm({
                      ...activityForm,
                      teacherStudentActivities: e.target.value
                    })
                  }
                  rows={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedOutcomes">Expected Outcomes *</Label>
                <Textarea
                  id="expectedOutcomes"
                  placeholder="Learning outcomes and expected products..."
                  value={activityForm.expectedOutcomes}
                  onChange={(e) =>
                    setActivityForm({
                      ...activityForm,
                      expectedOutcomes: e.target.value
                    })
                  }
                  rows={8}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderIndex">Order Index</Label>
              <Input
                id="orderIndex"
                type="number"
                min="1"
                value={activityForm.orderIndex}
                onChange={(e) =>
                  setActivityForm({
                    ...activityForm,
                    orderIndex: parseInt(e.target.value) || 1
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActivityDialogOpen(false);
                setEditingActivity(null);
                resetActivityForm();
              }}
              disabled={
                createActivityMutation.isPending ||
                updateActivityMutation.isPending
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveActivity}
              disabled={
                createActivityMutation.isPending ||
                updateActivityMutation.isPending
              }
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {(createActivityMutation.isPending ||
                updateActivityMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingActivity ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{activityToDelete?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteActivityMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteActivityMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteActivityMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
