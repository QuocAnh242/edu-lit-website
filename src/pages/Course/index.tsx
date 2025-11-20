import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../../components/shared/navbar';
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
  BookOpen,
  Edit,
  Trash2,
  Loader2,
  Search,
  AlertTriangle
} from 'lucide-react';
import {
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseById,
  CourseDto,
  CreateCourseRequest,
  UpdateCourseRequest
} from '@/services/course.api';
import {
  getAllSyllabuses,
  SyllabusDto,
  Semester
} from '@/services/syllabus.api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const CoursePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseDto | null>(null);
  const [viewingCourse, setViewingCourse] = useState<CourseDto | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<CourseDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseForm, setCourseForm] = useState<CreateCourseRequest>({
    syllabusId: '',
    courseCode: '',
    title: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    courseCode?: string;
    syllabusId?: string;
    description?: string;
  }>({});

  // Handle query parameters (for navigation from Syllabus page)
  useEffect(() => {
    const syllabusId = searchParams.get('syllabusId');
    const create = searchParams.get('create');
    const view = searchParams.get('view');
    const edit = searchParams.get('edit');

    if (syllabusId && create === 'true') {
      setCourseForm((prev) => ({ ...prev, syllabusId }));
      setCourseDialogOpen(true);
      // Clear query params
      setSearchParams({});
    } else if (view) {
      // Handle view course
      getCourseById(view).then((response) => {
        if (response.success && response.data) {
          setViewingCourse(response.data);
          setViewDialogOpen(true);
        }
      });
      // Clear query params
      setSearchParams({});
    } else if (edit) {
      // Handle edit course
      getCourseById(edit).then((response) => {
        if (response.success && response.data) {
          setEditingCourse(response.data);
          setCourseForm({
            syllabusId: response.data.syllabusId,
            courseCode: response.data.courseCode,
            title: response.data.title,
            description: response.data.description || ''
          });
          setCourseDialogOpen(true);
        }
      });
      // Clear query params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Fetch syllabuses (which include courses) for both dropdown and course list
  const { data: syllabusesData, isLoading: loadingSyllabuses } = useQuery({
    queryKey: ['syllabuses-with-courses'],
    queryFn: async () => {
      try {
        const response = await getAllSyllabuses({
          pageNumber: 1,
          pageSize: 1000,
          isActive: undefined // Get all to show courses from inactive syllabuses too
        });
        return response;
      } catch (error) {
        console.error('Error fetching syllabuses:', error);
        return {
          success: false,
          message: 'Failed to fetch syllabuses',
          data: {
            items: [],
            totalCount: 0,
            pageNumber: 1,
            pageSize: 1000,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false
          }
        };
      }
    }
  });

  const syllabuses = (syllabusesData?.data?.items || []) as SyllabusDto[];

  // Extract all courses from syllabuses
  const allCourses = (syllabusesData?.data?.items || []).flatMap(
    (syllabus: any) =>
      (syllabus.courses || []).map((course: any) => ({
        id: course.courseId || course.course_id || '',
        syllabusId: syllabus.id,
        syllabusTitle: syllabus.title || '',
        courseCode: course.courseCode || course.course_code || '',
        title: course.title || '',
        description: course.description || '',
        orderIndex: course.orderIndex || course.order_index || 0,
        durationWeeks: course.durationWeeks || course.duration_weeks || 0,
        isActive: course.isActive ?? course.is_active ?? true,
        createdAt: course.createdAt || course.created_at || '',
        updatedAt: course.updatedAt || course.updated_at || ''
      }))
  );

  // Filter by search term
  const courses = searchTerm
    ? allCourses.filter(
        (c: any) =>
          c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allCourses;

  const loadingCourses = false;
  const coursesError = false;

  // Mutations
  const createCourseMutation = useMutation({
    mutationFn: async (data: CreateCourseRequest) => {
      console.log('🔄 [CREATE COURSE] Sending request...', data);
      return await createCourse(data);
    },
    onSuccess: async (data) => {
      console.log('🎉 [CREATE COURSE SUCCESS] Course created!', data);

      // Show success toast immediately
      toast.success('Course created successfully! 🎉', {
        duration: 3000,
        position: 'top-center'
      });

      console.log(
        '🔄 [CREATE COURSE SUCCESS] Waiting for CQRS event propagation...'
      );

      // Wait for event to propagate: Command Service → RabbitMQ → Query Service → MongoDB
      // CQRS architecture with event sourcing can take up to 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds delay

      console.log('🔄 [CREATE COURSE SUCCESS] Refetching queries...');

      // AWAIT refetch to ensure data is fresh before closing dialog
      await queryClient.refetchQueries({
        queryKey: ['syllabuses-with-courses'],
        exact: false,
        type: 'active'
      });
      await queryClient.refetchQueries({
        queryKey: ['syllabuses'],
        exact: false,
        type: 'active'
      });

      console.log(
        '✅ [CREATE COURSE SUCCESS] Refetch completed, data is fresh'
      );

      // Close dialog AFTER refetch completes
      setCourseDialogOpen(false);
      resetCourseForm();
    },
    onError: (error: unknown) => {
      // Extract error message from API response
      const apiError = error as {
        message?: string;
        errors?: string[];
        errorCode?: string | number;
      };

      let errorMessage = apiError?.message || 'Failed to create course';

      // If there are validation errors, show them
      if (apiError?.errors && apiError.errors.length > 0) {
        errorMessage = apiError.errors.join(', ');
      }

      // Check for specific error codes (500 = database error)
      const isDbError =
        apiError?.errorCode === 500 ||
        apiError?.errorCode === '500' ||
        String(apiError?.errorCode) === '500';

      if (isDbError) {
        const errorMsgLower = errorMessage.toLowerCase();

        // Check for duplicate course code error
        if (
          errorMsgLower.includes('duplicate') ||
          errorMsgLower.includes('unique') ||
          errorMsgLower.includes('constraint') ||
          errorMsgLower.includes('unique_course_in_syllabus') ||
          errorMsgLower.includes('23505') || // PostgreSQL unique constraint violation
          (errorMsgLower.includes('course') &&
            errorMsgLower.includes('already exists'))
        ) {
          errorMessage = `A course with code "${courseForm.courseCode.trim()}" already exists in the selected syllabus. Please use a different course code.`;
          setFormErrors({
            courseCode:
              'This course code already exists in the selected syllabus'
          });
        } else if (
          errorMsgLower.includes('does not exist') ||
          (errorMsgLower.includes('relation') &&
            errorMsgLower.includes('not exist')) ||
          errorMsgLower.includes('42p01') ||
          (errorMsgLower.includes('syllabus') &&
            errorMsgLower.includes('not found'))
        ) {
          errorMessage = `Database Error: The selected syllabus does not exist. Please select a valid syllabus.`;
          setFormErrors({
            syllabusId: 'The selected syllabus does not exist'
          });
        } else {
          errorMessage = `Database error occurred. This might be due to a duplicate course code, missing syllabus, or another database constraint. Please verify your input and try again.`;
        }
      } else if (
        apiError?.errorCode === 404 ||
        String(apiError?.errorCode) === '404'
      ) {
        // Syllabus not found
        errorMessage = `The selected syllabus was not found. Please select a different syllabus.`;
        setFormErrors({
          syllabusId: 'Syllabus not found'
        });
      }

      toast.error(errorMessage, {
        duration: 5000
      });
      console.error('Create Course Error:', error);
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: UpdateCourseRequest;
    }) => {
      console.log('🔄 [UPDATE COURSE] Sending request...', { id, data });
      return await updateCourse(id, data);
    },
    onSuccess: async (data) => {
      console.log('🎉 [UPDATE COURSE SUCCESS] Course updated!', data);

      // Show success toast immediately
      toast.success('Course updated successfully! ✅', {
        duration: 3000,
        position: 'top-center'
      });

      console.log(
        '🔄 [UPDATE COURSE SUCCESS] Waiting for CQRS event propagation...'
      );

      // Wait for event to propagate
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds delay

      console.log('🔄 [UPDATE COURSE SUCCESS] Refetching queries...');

      // AWAIT refetch to ensure data is fresh
      await queryClient.refetchQueries({
        queryKey: ['syllabuses-with-courses'],
        exact: false,
        type: 'active'
      });
      await queryClient.refetchQueries({
        queryKey: ['syllabuses'],
        exact: false,
        type: 'active'
      });

      console.log('✅ [UPDATE COURSE SUCCESS] Refetch completed');

      // Close dialog AFTER refetch
      setCourseDialogOpen(false);
      setEditingCourse(null);
      resetCourseForm();
    },
    onError: (error: unknown) => {
      // Extract error message from API response
      const apiError = error as {
        message?: string;
        errors?: string[];
        errorCode?: string | number;
      };

      let errorMessage = apiError?.message || 'Failed to update course';

      // If there are validation errors, show them
      if (apiError?.errors && apiError.errors.length > 0) {
        errorMessage = apiError.errors.join(', ');
      }

      // Check for specific error codes
      const isDbError =
        apiError?.errorCode === 500 ||
        apiError?.errorCode === '500' ||
        String(apiError?.errorCode) === '500';

      if (isDbError) {
        const errorMsgLower = errorMessage.toLowerCase();

        // Check for duplicate course code error
        if (
          errorMsgLower.includes('duplicate') ||
          errorMsgLower.includes('unique') ||
          errorMsgLower.includes('constraint') ||
          errorMsgLower.includes('unique_course_in_syllabus') ||
          errorMsgLower.includes('23505')
        ) {
          errorMessage = `A course with code "${courseForm.courseCode.trim()}" already exists in the selected syllabus. Please use a different course code.`;
          setFormErrors({
            courseCode:
              'This course code already exists in the selected syllabus'
          });
        }
      }

      toast.error(errorMessage, {
        duration: 5000
      });
      console.error('Update Course Error:', error);
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      console.log('🔄 [DELETE COURSE] Sending request...', courseId);
      return await deleteCourse(courseId);
    },
    onSuccess: async (data) => {
      console.log('🎉 [DELETE COURSE SUCCESS] Course deleted!', data);

      // Show success toast immediately
      toast.success('Course deleted successfully! 🗑️', {
        duration: 3000,
        position: 'top-center'
      });

      console.log(
        '🔄 [DELETE COURSE SUCCESS] Waiting for CQRS event propagation...'
      );

      // Wait for event to propagate
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds delay

      console.log('🔄 [DELETE COURSE SUCCESS] Refetching queries...');

      // AWAIT refetch to ensure data is fresh
      await queryClient.refetchQueries({
        queryKey: ['syllabuses-with-courses'],
        exact: false,
        type: 'active'
      });
      await queryClient.refetchQueries({
        queryKey: ['syllabuses'],
        exact: false,
        type: 'active'
      });

      console.log('✅ [DELETE COURSE SUCCESS] Refetch completed');

      // Close dialog AFTER refetch
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to delete course';
      toast.error(errorMessage, {
        duration: 5000
      });
      console.error('❌ [DELETE COURSE ERROR]', error);
    }
  });

  // Handlers
  const handleCreateCourse = () => {
    setEditingCourse(null);
    resetCourseForm();
    setCourseDialogOpen(true);
  };

  const handleEditCourse = (course: CourseDto) => {
    setEditingCourse(course);
    setCourseForm({
      syllabusId: course.syllabusId,
      courseCode: course.courseCode,
      title: course.title,
      description: course.description || ''
    });
    setCourseDialogOpen(true);
  };

  const handleDeleteCourse = (course: CourseDto) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleViewCourse = async (course: CourseDto) => {
    // Navigate to sessions page for this course
    navigate(`/course/${course.id}/sessions`);
  };

  const validateCourseForm = (): {
    isValid: boolean;
    errors: {
      title?: string;
      courseCode?: string;
      syllabusId?: string;
      description?: string;
    };
  } => {
    const errors: {
      title?: string;
      courseCode?: string;
      syllabusId?: string;
      description?: string;
    } = {};

    // Validate Title
    if (!courseForm.title.trim()) {
      errors.title = 'Title is required';
    } else if (courseForm.title.trim().length > 200) {
      errors.title = 'Title cannot exceed 200 characters';
    }

    // Validate CourseCode
    if (!courseForm.courseCode.trim()) {
      errors.courseCode = 'Course code is required';
    } else if (courseForm.courseCode.trim().length > 20) {
      // Database constraint: max 20 characters (more restrictive than backend validator's 50)
      errors.courseCode =
        'Course code cannot exceed 20 characters (database limit)';
    }

    // Validate SyllabusId
    if (!courseForm.syllabusId.trim()) {
      errors.syllabusId = 'Syllabus is required';
    }

    // Validate Description
    if (courseForm.description && courseForm.description.trim().length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters';
    }

    setFormErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleSaveCourse = () => {
    // Clear previous errors
    setFormErrors({});

    // Validate form
    const validation = validateCourseForm();
    if (!validation.isValid) {
      // Show first error
      const firstError = Object.values(validation.errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    // Prepare data for API
    const dataToSend: CreateCourseRequest = {
      syllabusId: courseForm.syllabusId.trim(),
      courseCode: courseForm.courseCode.trim(),
      title: courseForm.title.trim(),
      description: courseForm.description?.trim() || ''
    };

    console.log('📋 [FORM DATA] Before trim:', {
      courseCode: `"${courseForm.courseCode}"`,
      length: courseForm.courseCode.length
    });
    console.log('📋 [DATA TO SEND] After trim:', {
      courseCode: `"${dataToSend.courseCode}"`,
      length: dataToSend.courseCode.length
    });

    // For creation, check if a course with the same CourseCode in the same Syllabus already exists
    if (!editingCourse) {
      const existingCourse = courses.find(
        (c) =>
          c.syllabusId.toLowerCase() === dataToSend.syllabusId.toLowerCase() &&
          c.courseCode.toLowerCase() === dataToSend.courseCode.toLowerCase()
      );

      if (existingCourse) {
        toast.error(
          `A course with code "${dataToSend.courseCode}" already exists in this syllabus. Please use a different course code.`
        );
        setFormErrors({
          courseCode: 'This course code already exists in the selected syllabus'
        });
        return;
      }
    } else {
      // For updates, check if another course (not the one being edited) has the same CourseCode in the same Syllabus
      const existingCourse = courses.find(
        (c) =>
          c.id !== editingCourse.id &&
          c.syllabusId.toLowerCase() === dataToSend.syllabusId.toLowerCase() &&
          c.courseCode.toLowerCase() === dataToSend.courseCode.toLowerCase()
      );

      if (existingCourse) {
        toast.error(
          `A course with code "${dataToSend.courseCode}" already exists in this syllabus. Please use a different course code.`
        );
        setFormErrors({
          courseCode: 'This course code already exists in the selected syllabus'
        });
        return;
      }

      updateCourseMutation.mutate({
        id: editingCourse.id,
        data: dataToSend
      });
      return;
    }

    createCourseMutation.mutate(dataToSend);
  };

  const handleDeleteConfirm = () => {
    if (courseToDelete) {
      deleteCourseMutation.mutate(courseToDelete.id);
    }
  };

  const resetCourseForm = () => {
    setCourseForm({
      syllabusId: '',
      courseCode: '',
      title: '',
      description: ''
    });
    setFormErrors({});
  };

  return (
    <>
      <style>{`
        html {
          overflow-y: scroll;
          scrollbar-gutter: stable;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.3s ease-out forwards; }
      `}</style>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="animate-fade-in-up mb-8 flex items-center justify-between">
            <div>
              <h1
                className="mb-2 flex items-center gap-2 text-4xl font-bold text-cyan-600"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                <BookOpen className="h-10 w-10 transition-transform hover:scale-110" />
                Courses
              </h1>
              <p
                className="text-lg text-gray-600"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                Manage your courses and learning materials
              </p>
            </div>
            <Button
              onClick={handleCreateCourse}
              className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg transition-all duration-300 hover:scale-105 hover:from-cyan-700 hover:to-blue-700 hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Create Course
            </Button>
          </div>

          {/* Search Bar */}
          <Card
            className="animate-slide-in mb-6 shadow-lg"
            style={{ animationDelay: '0.1s', opacity: 0 }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search courses by title, code, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Table */}
          <Card
            className="animate-slide-in shadow-lg transition-all duration-300 hover:shadow-2xl"
            style={{ animationDelay: '0.2s', opacity: 0 }}
          >
            <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 transition-transform hover:scale-110" />
                  All Courses
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingCourses ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              ) : coursesError ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <BookOpen className="mb-4 h-16 w-16 text-red-300" />
                  <h3 className="mb-2 text-xl font-semibold text-red-700">
                    Error loading courses
                  </h3>
                  <p className="mb-4 text-gray-500">
                    An error occurred while loading courses. Please try again.
                  </p>
                  <Button
                    onClick={() =>
                      queryClient.invalidateQueries({ queryKey: ['courses'] })
                    }
                    variant="outline"
                    className="gap-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <BookOpen className="mb-4 h-16 w-16 text-gray-300" />
                  <h3 className="mb-2 text-xl font-semibold text-gray-700">
                    No courses yet
                  </h3>
                  <p className="mb-4 text-gray-500">
                    {searchTerm
                      ? 'No courses found matching your search.'
                      : 'Get started by creating your first course'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleCreateCourse} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create First Course
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[25%]">Title</TableHead>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Syllabus</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course: CourseDto) => (
                      <TableRow
                        key={course.id}
                        className="transition-colors duration-200 hover:bg-cyan-50"
                      >
                        <TableCell className="font-medium">
                          <div className="text-sm font-semibold">
                            {course.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {course.courseCode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="line-clamp-2 max-w-md text-sm text-gray-600">
                            {course.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {(course as any).syllabusTitle ||
                              'Unknown Syllabus'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {course.createdAt
                            ? new Date(course.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewCourse(course)}
                              className="transition-all duration-200 hover:scale-110 hover:bg-purple-50"
                              title="Manage sessions"
                            >
                              <BookOpen className="h-4 w-4 text-purple-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCourse(course)}
                              className="transition-all duration-200 hover:scale-110 hover:bg-green-50"
                              title="Edit course"
                            >
                              <Edit className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCourse(course)}
                              disabled={deleteCourseMutation.isPending}
                              className="transition-all duration-200 hover:scale-110 hover:bg-red-50"
                              title="Delete course"
                            >
                              {deleteCourseMutation.isPending &&
                              courseToDelete?.id === course.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-500" />
                              )}
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

          {/* Stats Cards */}
          {!loadingCourses && courses.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card
                className="animate-scale-in border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ animationDelay: '0.3s', opacity: 0 }}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-cyan-700">
                    Total Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-cyan-600">
                    {courses.length}
                  </div>
                </CardContent>
              </Card>
              <Card
                className="animate-scale-in border-green-200 bg-gradient-to-br from-green-50 to-green-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ animationDelay: '0.4s', opacity: 0 }}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-green-700">
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {
                      courses.filter((c: CourseDto) => {
                        if (!c.createdAt) return false;
                        const created = new Date(c.createdAt);
                        const now = new Date();
                        return (
                          created.getMonth() === now.getMonth() &&
                          created.getFullYear() === now.getFullYear()
                        );
                      }).length
                    }
                  </div>
                </CardContent>
              </Card>
              <Card
                className="animate-scale-in border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ animationDelay: '0.5s', opacity: 0 }}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-blue-700">
                    Recently Updated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {
                      courses.filter((c: CourseDto) => {
                        if (!c.updatedAt) return false;
                        const updated = new Date(c.updatedAt);
                        const now = new Date();
                        const daysDiff = Math.floor(
                          (now.getTime() - updated.getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        return daysDiff <= 7;
                      }).length
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        {/* Course Create/Edit Dialog */}
        <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? 'Edit Course' : 'Create Course'}
              </DialogTitle>
              <DialogDescription>
                {editingCourse
                  ? 'Update the course information.'
                  : 'Create a new course for your syllabus.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter course title (max 200 characters)"
                  value={courseForm.title}
                  onChange={(e) => {
                    setCourseForm({ ...courseForm, title: e.target.value });
                    if (formErrors.title) {
                      setFormErrors({ ...formErrors, title: undefined });
                    }
                  }}
                  className={formErrors.title ? 'border-red-500' : ''}
                  maxLength={200}
                />
                {formErrors.title && (
                  <p className="flex items-center gap-1 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {formErrors.title}
                  </p>
                )}
                {!formErrors.title && courseForm.title && (
                  <p className="text-xs text-gray-500">
                    {courseForm.title.length}/200 characters
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseCode">Course Code *</Label>
                <Input
                  id="courseCode"
                  placeholder="Enter course code (e.g., CS101, max 20 characters)"
                  value={courseForm.courseCode}
                  onChange={(e) => {
                    setCourseForm({
                      ...courseForm,
                      courseCode: e.target.value
                    });
                    if (formErrors.courseCode) {
                      setFormErrors({ ...formErrors, courseCode: undefined });
                    }
                  }}
                  className={formErrors.courseCode ? 'border-red-500' : ''}
                  maxLength={20}
                />
                {formErrors.courseCode && (
                  <p className="flex items-center gap-1 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {formErrors.courseCode}
                  </p>
                )}
                {!formErrors.courseCode && courseForm.courseCode && (
                  <p className="text-xs text-gray-500">
                    {courseForm.courseCode.length}/20 characters
                  </p>
                )}
                {!formErrors.courseCode && !courseForm.courseCode && (
                  <p className="text-xs text-gray-500">
                    Course code must be unique within the selected syllabus
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="syllabusId">Syllabus *</Label>
                <Select
                  value={courseForm.syllabusId}
                  onValueChange={(value) => {
                    setCourseForm({ ...courseForm, syllabusId: value });
                    if (formErrors.syllabusId) {
                      setFormErrors({ ...formErrors, syllabusId: undefined });
                    }
                    // Clear course code error when syllabus changes, as duplicate check is per syllabus
                    if (
                      formErrors.courseCode &&
                      formErrors.courseCode.includes('already exists')
                    ) {
                      setFormErrors({ ...formErrors, courseCode: undefined });
                    }
                  }}
                  disabled={loadingSyllabuses}
                >
                  <SelectTrigger
                    id="syllabusId"
                    className={formErrors.syllabusId ? 'border-red-500' : ''}
                  >
                    <SelectValue
                      placeholder={
                        loadingSyllabuses
                          ? 'Loading syllabuses...'
                          : 'Select a syllabus'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {syllabuses.map((syllabus) => {
                      const getSemesterName = (semester: Semester): string => {
                        switch (semester) {
                          case Semester.HocKiI:
                            return 'Học kỳ I';
                          case Semester.HocKiII:
                            return 'Học kỳ II';
                          case Semester.GiuaHocKiI:
                            return 'Giữa học kỳ I';
                          case Semester.GiuaHocKiII:
                            return 'Giữa học kỳ II';
                          case Semester.CuoiHocKiI:
                            return 'Cuối học kỳ I';
                          case Semester.CuoiHocKiII:
                            return 'Cuối học kỳ II';
                          default:
                            return `Semester ${semester}`;
                        }
                      };
                      return (
                        <SelectItem key={syllabus.id} value={syllabus.id}>
                          {syllabus.title} - {syllabus.academicYear} (
                          {getSemesterName(syllabus.semester)})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {formErrors.syllabusId && (
                  <p className="flex items-center gap-1 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {formErrors.syllabusId}
                  </p>
                )}
                {syllabuses.length === 0 &&
                  !loadingSyllabuses &&
                  !formErrors.syllabusId && (
                    <p className="text-xs text-yellow-600">
                      No active syllabuses available. Please create a syllabus
                      first.
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter course description (optional, max 1000 characters)"
                  value={courseForm.description}
                  onChange={(e) => {
                    setCourseForm({
                      ...courseForm,
                      description: e.target.value
                    });
                    if (formErrors.description) {
                      setFormErrors({ ...formErrors, description: undefined });
                    }
                  }}
                  rows={4}
                  className={formErrors.description ? 'border-red-500' : ''}
                  maxLength={1000}
                />
                {formErrors.description && (
                  <p className="flex items-center gap-1 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {formErrors.description}
                  </p>
                )}
                {!formErrors.description && courseForm.description && (
                  <p className="text-xs text-gray-500">
                    {courseForm.description.length}/1000 characters
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCourseDialogOpen(false);
                  setEditingCourse(null);
                  resetCourseForm();
                }}
                disabled={
                  createCourseMutation.isPending ||
                  updateCourseMutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCourse}
                disabled={
                  createCourseMutation.isPending ||
                  updateCourseMutation.isPending
                }
                className="bg-gradient-to-r from-cyan-600 to-blue-600"
              >
                {(createCourseMutation.isPending ||
                  updateCourseMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {createCourseMutation.isPending
                  ? 'Creating...'
                  : updateCourseMutation.isPending
                    ? 'Updating...'
                    : editingCourse
                      ? 'Update'
                      : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Course Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Course Details</DialogTitle>
              <DialogDescription>
                View detailed information about the course
              </DialogDescription>
            </DialogHeader>
            {viewingCourse && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Title
                  </Label>
                  <p className="text-lg font-medium">{viewingCourse.title}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Course Code
                  </Label>
                  <Badge variant="outline" className="font-mono text-base">
                    {viewingCourse.courseCode}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Description
                  </Label>
                  <p className="text-gray-600">
                    {viewingCourse.description || 'No description provided'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Syllabus ID
                    </Label>
                    <p className="break-all font-mono text-xs text-gray-500">
                      {viewingCourse.syllabusId}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Course ID
                    </Label>
                    <p className="break-all font-mono text-xs text-gray-500">
                      {viewingCourse.id}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Created At
                    </Label>
                    <p className="text-sm text-gray-600">
                      {viewingCourse.createdAt
                        ? new Date(viewingCourse.createdAt).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Updated At
                    </Label>
                    <p className="text-sm text-gray-600">
                      {viewingCourse.updatedAt
                        ? new Date(viewingCourse.updatedAt).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setViewDialogOpen(false);
                  setViewingCourse(null);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Course</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the course "
                {courseToDelete?.title}"? This action cannot be undone and will
                permanently delete the course and all its associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deleteCourseMutation.isPending}
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setCourseToDelete(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteCourseMutation.isPending}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleteCourseMutation.isPending ? (
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
    </>
  );
};

export default CoursePage;
