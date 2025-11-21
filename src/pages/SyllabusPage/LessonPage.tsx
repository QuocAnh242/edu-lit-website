import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
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
  Eye,
  GraduationCap,
  FolderOpen,
  Loader2,
  Search,
  AlertTriangle,
  Calendar,
  BookMarked,
  Library,
  CheckCircle2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import __helpers from '@/helpers';

//GET API SYLLABUS
import {
  getAllSyllabuses, // GET all syllabuses
  createSyllabus, // POST new syllabus
  updateSyllabus, // PUT update syllabus
  deleteSyllabus, // DELETE syllabus
  SyllabusDto,
  CreateSyllabusRequest,
  UpdateSyllabusRequest,
  Semester
} from '@/services/syllabus.api';
import { CourseDto } from '@/services/course.api';

// Extended type for UI display (combining Syllabus with Courses)
interface SyllabusWithCourses extends SyllabusDto {
  coursesCount: number;
  courses: CourseDto[];
}

export default function LessonPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<
    Semester | undefined
  >(undefined);
  const [showActiveOnly, setShowActiveOnly] = useState<boolean | undefined>(
    undefined
  );

  // State for dialogs
  const [syllabusDialogOpen, setSyllabusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState<SyllabusDto | null>(
    null
  );
  const [syllabusToDelete, setSyllabusToDelete] = useState<SyllabusDto | null>(
    null
  );
  const [syllabusForm, setSyllabusForm] = useState<CreateSyllabusRequest>({
    title: '',
    academicYear: '',
    semester: Semester.HocKiI,
    description: ''
  });
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    academicYear?: string;
    semester?: string;
    description?: string;
    yearSemesterCombo?: string; // Error for Academic Year + Semester combination
  }>({});
  const [errorShakeKey, setErrorShakeKey] = useState(0); // Key to trigger shake animation

  // Get user role
  const userRole = __helpers.getUserRole();
  const isTeacher = () => {
    return userRole === 'ADMIN' || userRole === 'TEACHER';
  };

  // Fetch syllabuses
  const {
    data: syllabusesData,
    isLoading: loadingSyllabuses,
    isError: syllabusesError
  } = useQuery({
    queryKey: ['syllabuses', searchTerm, selectedSemester, showActiveOnly],
    queryFn: async () => {
      console.log('🔄 [FETCH SYLLABUSES] Starting fetch...');
      console.log('📋 Query params:', {
        pageNumber: 1,
        pageSize: 100,
        searchTerm: searchTerm || undefined,
        semester: selectedSemester,
        isActive: showActiveOnly
      });

      const response = await getAllSyllabuses({
        pageNumber: 1,
        pageSize: 100,
        searchTerm: searchTerm || undefined,
        semester: selectedSemester,
        isActive: showActiveOnly
      });

      console.log('✅ [FETCH SYLLABUSES] Response received:', response);
      console.log('📊 Total syllabuses:', response?.data?.items?.length || 0);
      console.log('📝 Syllabuses data:', response?.data?.items);

      return response;
    },
    staleTime: 0, // Always consider data stale - refetch immediately
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false // Don't refetch on window focus to avoid too many requests
  });

  let syllabuses = (syllabusesData?.data?.items || []) as SyllabusDto[];

  // Client-side filter by semester if selected (since backend might not filter correctly)
  if (selectedSemester !== undefined) {
    syllabuses = syllabuses.filter((s) => s.semester === selectedSemester);
    console.log(
      '🔍 [CLIENT FILTER] Filtered by semester:',
      selectedSemester,
      'Count:',
      syllabuses.length
    );
  }

  // Sort by academic year (newest first: 2025-2026 before 2024-2025)
  syllabuses = syllabuses.sort((a, b) => {
    // Extract start year from "YYYY-YYYY" format
    const yearA = parseInt(a.academicYear?.split('-')[0] || '0');
    const yearB = parseInt(b.academicYear?.split('-')[0] || '0');
    return yearB - yearA; // Descending order (newest first)
  });

  console.log('🎯 [SYLLABUSES STATE] Current syllabuses in state:', syllabuses);
  console.log('📊 [SYLLABUSES STATE] Count:', syllabuses.length);

  // Extract courses from syllabuses (courses are already included in syllabus response from MongoDB)
  // No need for separate API call - courses come with each syllabus
  const allCourses = syllabuses.flatMap(
    (syllabus) =>
      (syllabus as any).courses?.map((course: any) => ({
        id: course.courseId || course.course_id || '',
        syllabusId: syllabus.id,
        courseCode: course.courseCode || course.course_code || '',
        title: course.title || '',
        description: course.description || '',
        orderIndex: course.orderIndex || course.order_index || 0,
        durationWeeks: course.durationWeeks || course.duration_weeks || 0,
        isActive: course.isActive ?? course.is_active ?? true,
        createdAt: course.createdAt || course.created_at || '',
        updatedAt: course.updatedAt || course.updated_at || ''
      })) || []
  );

  console.log('📚 [COURSES FROM SYLLABUSES] Total courses:', allCourses.length);
  console.log('📚 [COURSES FROM SYLLABUSES] Courses:', allCourses);

  // Map syllabuses with course counts
  const syllabusesWithCourses: SyllabusWithCourses[] = syllabuses.map(
    (syllabus) => ({
      ...syllabus,
      coursesCount: allCourses.filter((c) => c.syllabusId === syllabus.id)
        .length,
      courses: allCourses.filter((c) => c.syllabusId === syllabus.id)
    })
  );

  // Mutations
  // CREATE SYLLABUS
  const createSyllabusMutation = useMutation({
    mutationFn: async (data: CreateSyllabusRequest) => {
      console.log('🚀 [CREATE MUTATION] Sending create request...');
      console.log('📤 [CREATE MUTATION] Data:', data);
      const result = await createSyllabus(data);
      console.log('✅ [CREATE MUTATION] Response:', result);
      return result;
    },
    onSuccess: async (data) => {
      console.log('🎉 [CREATE SUCCESS] Syllabus created successfully!');
      console.log('📋 [CREATE SUCCESS] Response data:', data);

      // Show success toast immediately
      toast.success('Syllabus created successfully! 🎉', {
        duration: 3000,
        position: 'top-center'
      });

      console.log('🔄 [CREATE SUCCESS] Waiting for CQRS event propagation...');

      // Wait for event to propagate: Command Service → RabbitMQ → Query Service → MongoDB
      // Increased to 5 seconds to ensure MongoDB is fully synced
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds delay

      console.log('🔄 [CREATE SUCCESS] Refetching queries...');

      // AWAIT refetch to ensure data is fresh before closing dialog
      await queryClient.refetchQueries({
        queryKey: ['syllabuses'],
        exact: false,
        type: 'active'
      });
      await queryClient.refetchQueries({
        queryKey: ['courses'],
        exact: false,
        type: 'active'
      });

      console.log('✅ [CREATE SUCCESS] Refetch completed, data is fresh');

      // Close dialog AFTER refetch completes
      setSyllabusDialogOpen(false);
      resetSyllabusForm();
    },
    onError: (error: unknown) => {
      console.error('❌ [CREATE SYLLABUS ERROR] Full error:', error);

      // Extract error message from API response
      // Axios interceptor already extracts error.response.data, so error is the API response object
      const apiError = error as {
        message?: string;
        errors?: string[];
        errorCode?: string | number;
        success?: boolean;
      };

      console.error('❌ [CREATE SYLLABUS ERROR] Parsed error:', {
        message: apiError?.message,
        errors: apiError?.errors,
        errorCode: apiError?.errorCode
      });

      let errorMessage = apiError?.message || 'Failed to create syllabus';

      // If there are validation errors, show them
      if (apiError?.errors && apiError.errors.length > 0) {
        errorMessage = apiError.errors.join(', ');
      }

      // Check for specific error codes (500 = database error)
      // The error code might be a number or string, so check both
      const isDbError =
        apiError?.errorCode === 500 ||
        apiError?.errorCode === '500' ||
        String(apiError?.errorCode) === '500';

      if (isDbError) {
        // Database error - could be constraint violation, missing table, or other database issue
        const errorMsgLower = errorMessage.toLowerCase();

        // Check for missing table error (42P01 is PostgreSQL error code for "relation does not exist")
        // The backend error handler catches the exception but the inner exception details might not be exposed
        // However, if we see "entity changes" error with errorCode 500, it could be a missing table
        const isMissingTableError =
          errorMsgLower.includes('does not exist') ||
          (errorMsgLower.includes('relation') &&
            errorMsgLower.includes('not exist')) ||
          errorMsgLower.includes('42p01') ||
          (errorMsgLower.includes('table') &&
            errorMsgLower.includes('not found')) ||
          (errorMsgLower.includes('syllabus') &&
            errorMsgLower.includes('not exist'));

        if (isMissingTableError) {
          // Database table doesn't exist - migrations haven't been run
          errorMessage = `Database Setup Required: The database tables have not been created yet. The "syllabus" table is missing. Please run database migrations to create the required tables. See MIGRATION_GUIDE.md in the lesson-service directory for instructions.`;
          console.error('Database Migration Required:', {
            error: 'The syllabus table does not exist in the database',
            solution:
              'Run database migrations using: dotnet ef database update',
            guide: 'See MIGRATION_GUIDE.md for detailed instructions'
          });
        } else if (
          errorMsgLower.includes('entity changes') ||
          errorMsgLower.includes('duplicate') ||
          errorMsgLower.includes('unique') ||
          errorMsgLower.includes('constraint') ||
          errorMsgLower.includes('violation') ||
          errorMsgLower.includes('already exists') ||
          errorMsgLower.includes('23505') || // PostgreSQL unique constraint violation error code
          errorMsgLower.includes('cannot insert duplicate')
        ) {
          // Backend has unique constraint on (AcademicYear, Semester)
          // This means multiple syllabuses with same year/semester are not allowed by backend
          errorMessage = `Backend constraint: Only one syllabus per Academic Year and Semester is allowed. A syllabus for "${syllabusForm.academicYear.trim()}" - "${getSemesterDisplayName(syllabusForm.semester)}" already exists. Please choose a different year or semester.`;
          // Set form error to highlight the field
          setFormErrors({
            academicYear:
              'This Academic Year and Semester combination already exists (backend constraint)'
          });
        } else {
          // Generic database error - provide helpful message
          errorMessage = `Database error occurred. This might be due to:\n• A duplicate Academic Year and Semester combination\n• Database connection issues\n• Missing database tables (migrations not run)\n\nPlease verify your input and contact your administrator if the problem persists.`;
        }
      }

      toast.error(errorMessage, {
        duration: 5000 // Show for 5 seconds since it's an important error
      });
      console.error('Create Syllabus Error:', error);
    }
  });

  // UPDATE SYLLABUS
  const updateSyllabusMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: UpdateSyllabusRequest;
    }) => {
      console.log('🔄 [UPDATE MUTATION] Sending update request...');
      console.log('📋 [UPDATE MUTATION] ID:', id);
      console.log('📤 [UPDATE MUTATION] Data:', data);
      const result = await updateSyllabus(id, data);
      console.log('✅ [UPDATE MUTATION] Response:', result);
      return result;
    },
    onSuccess: async (data) => {
      console.log('🎉 [UPDATE SUCCESS] Syllabus updated successfully!');
      console.log('📋 [UPDATE SUCCESS] Response data:', data);

      // Show success toast immediately
      toast.success('Syllabus updated successfully! ✅', {
        duration: 3000,
        position: 'top-center'
      });

      console.log('🔄 [UPDATE SUCCESS] Waiting for CQRS event propagation...');

      // Wait longer for event to propagate: Command Service → RabbitMQ → Query Service → MongoDB
      // CQRS architecture with event sourcing can take up to 5 seconds
      // Increased to 5 seconds to ensure MongoDB is fully synced
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds delay

      console.log('🔄 [UPDATE SUCCESS] Refetching queries...');

      // AWAIT refetch to ensure data is fresh before closing dialog
      await queryClient.refetchQueries({
        queryKey: ['syllabuses'],
        exact: false,
        type: 'active'
      });
      await queryClient.refetchQueries({
        queryKey: ['courses'],
        exact: false,
        type: 'active'
      });

      console.log(
        '✅ [UPDATE SUCCESS] Refetch completed, data should be fresh'
      );

      // Close dialog AFTER refetch completes
      setSyllabusDialogOpen(false);
      setEditingSyllabus(null);
      resetSyllabusForm();
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to update syllabus';
      toast.error(errorMessage);
    }
  });

  // DELETE SYLLABUS
  const deleteSyllabusMutation = useMutation({
    mutationFn: async (syllabusId: string) => {
      console.log('🗑️ [DELETE MUTATION] Deleting syllabus...');
      console.log('📋 [DELETE MUTATION] ID:', syllabusId);
      const result = await deleteSyllabus(syllabusId);
      console.log('✅ [DELETE MUTATION] Response:', result);
      return result;
    },
    onSuccess: async (data) => {
      console.log('🎉 [DELETE SUCCESS] Syllabus deleted successfully!');
      console.log('📋 [DELETE SUCCESS] Response data:', data);

      // Show success toast immediately
      toast.success('Syllabus deleted successfully! 🗑️', {
        duration: 3000,
        position: 'top-center'
      });

      console.log('🔄 [DELETE SUCCESS] Waiting for CQRS event propagation...');

      // Wait for event to propagate: Command Service → RabbitMQ → Query Service → MongoDB
      // Increased to 5 seconds to ensure MongoDB is fully synced
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds delay

      console.log('🔄 [DELETE SUCCESS] Refetching queries...');

      // AWAIT refetch to ensure data is fresh before closing dialog
      await queryClient.refetchQueries({
        queryKey: ['syllabuses'],
        exact: false,
        type: 'active'
      });
      await queryClient.refetchQueries({
        queryKey: ['courses'],
        exact: false,
        type: 'active'
      });

      console.log('✅ [DELETE SUCCESS] Refetch completed, data is fresh');

      // Close dialog AFTER refetch completes
      setDeleteDialogOpen(false);
      setSyllabusToDelete(null);
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to delete syllabus';
      toast.error(errorMessage);
    }
  });

  // Handlers
  const handleCreateSyllabus = () => {
    setEditingSyllabus(null);
    resetSyllabusForm();
    setSyllabusDialogOpen(true);
  };

  const handleEditSyllabus = (syllabus: SyllabusDto) => {
    setEditingSyllabus(syllabus);
    setSyllabusForm({
      title: syllabus.title,
      academicYear: syllabus.academicYear,
      semester: syllabus.semester,
      description: syllabus.description || ''
    });
    setSyllabusDialogOpen(true);
  };

  const handleDeleteSyllabus = (syllabus: SyllabusDto) => {
    console.log('🗑️ [DELETE] Syllabus to delete:', syllabus);
    console.log('🔑 [DELETE] Syllabus ID:', syllabus.id);
    setSyllabusToDelete(syllabus);
    setDeleteDialogOpen(true);
  };

  const validateSyllabusForm = () => {
    console.log(' [VALIDATION START] Current form data:', {
      title: syllabusForm.title,
      academicYear: syllabusForm.academicYear,
      semester: syllabusForm.semester,
      description: syllabusForm.description,
      isEditing: !!editingSyllabus
    });

    const errors: {
      title?: string;
      academicYear?: string;
      description?: string;
    } = {};

    // Validate Title
    console.log(' Validating Title:', syllabusForm.title);
    if (!syllabusForm.title.trim()) {
      errors.title = 'Title is required';
      console.log(' Title Error:', errors.title);
    } else if (syllabusForm.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters';
      console.log(' Title Error:', errors.title);
    } else if (syllabusForm.title.trim().length > 100) {
      errors.title = 'Title cannot exceed 100 characters';
      console.log(' Title Error:', errors.title);
    } else {
      console.log(' Title is valid');
    }

    // Validate AcademicYear
    console.log(' Validating Academic Year:', syllabusForm.academicYear);
    if (!syllabusForm.academicYear.trim()) {
      errors.academicYear = 'Academic year is required';
      console.log(' Academic Year Error:', errors.academicYear);
    } else {
      const yearPattern = /^\d{4}-\d{4}$/;
      console.log(
        ' Testing pattern:',
        yearPattern.test(syllabusForm.academicYear.trim())
      );
      if (!yearPattern.test(syllabusForm.academicYear.trim())) {
        errors.academicYear =
          'Academic year must be in the format YYYY-YYYY (e.g., 2024-2025)';
        console.log(' Academic Year Error (format):', errors.academicYear);
      } else {
        const years = syllabusForm.academicYear.trim().split('-');
        const startYear = parseInt(years[0]);
        const endYear = parseInt(years[1]);
        const currentYear = new Date().getFullYear();
        console.log(' Year validation:', { startYear, endYear, currentYear });

        if (endYear <= startYear) {
          errors.academicYear = 'End year must be greater than start year';
          console.log(
            ' Academic Year Error (end <= start):',
            errors.academicYear
          );
        } else if (startYear < 2000 || endYear > currentYear + 5) {
          errors.academicYear = `Academic year must be between 2000 and ${currentYear + 5}`;
          console.log(' Academic Year Error (range):', errors.academicYear);
        } else {
          console.log(' Academic Year is valid');
        }
      }
    }

    // Validate Description (required for both creation and update)
    console.log(' Validating Description:', syllabusForm.description);
    if (!syllabusForm.description || !syllabusForm.description.trim()) {
      errors.description = 'Description is required';
      console.log(' Description Error:', errors.description);
    } else if (syllabusForm.description.trim().length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
      console.log(' Description Error:', errors.description);
    } else {
      console.log(' Description is valid');
    }

    console.log(' [VALIDATION RESULT]', {
      isValid: Object.keys(errors).length === 0,
      errors: errors,
      errorCount: Object.keys(errors).length
    });

    setFormErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleSaveSyllabus = () => {
    try {
      console.log('\n🚀 [SAVE SYLLABUS] Button clicked');
      console.log('📋 Current form state:', syllabusForm);

      // Clear previous errors
      setFormErrors({});

      // Validate form
      const validation = validateSyllabusForm();
      if (!validation.isValid) {
        console.log('❌ [VALIDATION FAILED]');
        console.log('🔴 All errors:', validation.errors);

        // Show first error
        const firstError = Object.values(validation.errors)[0];
        if (firstError) {
          console.log('⚠️ Showing error to user:', firstError);
          toast.error(firstError);
        }
        return;
      }

      console.log('✅ [VALIDATION PASSED]');

      // Prepare data for API
      // Note: Description is validated above, so for creation it will always have a value
      const dataToSend: CreateSyllabusRequest = {
        title: syllabusForm.title.trim(),
        academicYear: syllabusForm.academicYear.trim(),
        semester: syllabusForm.semester,
        description: syllabusForm.description?.trim() || ''
      };

      console.log('📤 [DATA TO SEND]', dataToSend);
      console.log('🔍 [DEBUG] About to check duplicates...');

      // For creation, check if a syllabus with the same AcademicYear + Semester already exists
      // Backend constraint: Only one syllabus per Academic Year and Semester (Title can be duplicate)
      // Note: This is a client-side check that may not catch all cases if syllabuses are filtered/paginated
      // The backend will also enforce the unique constraint, so we'll handle that error gracefully
      if (!editingSyllabus) {
        console.log('🔍 [DUPLICATE CHECK] Checking for duplicates...');
        console.log(
          '📊 [DUPLICATE CHECK] Current syllabuses count:',
          syllabuses.length
        );
        console.log('📋 [DUPLICATE CHECK] Looking for:', {
          academicYear: dataToSend.academicYear,
          semester: dataToSend.semester
        });

        const existingSyllabus = syllabuses.find(
          (s) =>
            s.academicYear?.trim().toLowerCase() ===
              dataToSend.academicYear?.trim().toLowerCase() &&
            s.semester === dataToSend.semester
        );

        console.log(
          '🔎 [DUPLICATE CHECK] Result:',
          existingSyllabus ? 'FOUND' : 'NOT FOUND'
        );

        if (existingSyllabus) {
          console.log(
            '⚠️ [DUPLICATE CHECK] Found existing syllabus:',
            existingSyllabus
          );
          toast.error(
            `A syllabus for Academic Year "${dataToSend.academicYear}" and Semester "${getSemesterDisplayName(dataToSend.semester)}" already exists. Only one syllabus per year and semester is allowed.`
          );
          setFormErrors({
            yearSemesterCombo:
              'This Academic Year and Semester combination already exists'
          });
          // Trigger shake animation by changing key
          setErrorShakeKey((prev) => prev + 1);
          return;
        } else {
          console.log(
            '✅ [DUPLICATE CHECK] No duplicate found, proceeding to create...'
          );
        }
      }

      if (editingSyllabus) {
        console.log('✏️ [EDIT MODE] Updating syllabus:', editingSyllabus.id);
        // For updates, check if another syllabus (not the one being edited) has the same AcademicYear + Semester
        const existingSyllabus = syllabuses.find(
          (s) =>
            s.id !== editingSyllabus.id &&
            s.academicYear?.trim().toLowerCase() ===
              dataToSend.academicYear?.trim().toLowerCase() &&
            s.semester === dataToSend.semester
        );

        if (existingSyllabus) {
          console.log(
            '⚠️ [DUPLICATE CHECK - EDIT] Found existing syllabus:',
            existingSyllabus
          );
          toast.error(
            `A syllabus for Academic Year "${dataToSend.academicYear}" and Semester "${getSemesterDisplayName(dataToSend.semester)}" already exists. Only one syllabus per year and semester is allowed.`
          );
          setFormErrors({
            yearSemesterCombo:
              'This Academic Year and Semester combination already exists'
          });
          // Trigger shake animation by changing key
          setErrorShakeKey((prev) => prev + 1);
          return;
        } else {
          console.log('✅ [DUPLICATE CHECK - EDIT] No duplicate found');
        }

        console.log('🔄 Calling update mutation...');
        console.log('📋 Update payload:', {
          id: editingSyllabus.id,
          data: dataToSend
        });
        console.log('⏳ Mutation pending?', updateSyllabusMutation.isPending);
        console.log('📝 Current form data:', syllabusForm);
        console.log('🆔 Editing syllabus ID:', editingSyllabus.id);
        console.log(
          '📊 Current syllabuses in state:',
          syllabuses.map((s) => ({ id: s.id, title: s.title }))
        );

        updateSyllabusMutation.mutate({
          id: editingSyllabus.id,
          data: dataToSend
        });

        console.log('✅ Mutation.mutate() called - waiting for response...');
      } else {
        console.log('➕ [CREATE MODE] Creating new syllabus');
        console.log('🔄 Calling create mutation...');
        createSyllabusMutation.mutate(dataToSend);
      }
    } catch (error) {
      console.error('❌ [SAVE SYLLABUS ERROR]', error);
      toast.error(
        'An unexpected error occurred. Please check the console for details.'
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (syllabusToDelete) {
      deleteSyllabusMutation.mutate(syllabusToDelete.id);
    }
  };

  const resetSyllabusForm = () => {
    setSyllabusForm({
      title: '',
      academicYear: '',
      semester: Semester.HocKiI,
      description: ''
    });
    setFormErrors({});
  };

  const getSemesterDisplayName = (semester: Semester): string => {
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
        return 'Unknown';
    }
  };

  const handleViewCourse = (courseId: string) => {
    // Navigate to course detail page or show course details
    navigate(`/course?view=${courseId}`);
  };

  const handleCreateCourse = (syllabusId: string) => {
    navigate(`/course?create=true&syllabusId=${syllabusId}`);
  };

  return (
    <>
      <style>{`
        html {
          overflow-y: scroll;
          scrollbar-gutter: stable;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animate-slide-in {
          animation: slideIn 0.4s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="animate-fade-in-up mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 flex items-center gap-2 text-4xl font-bold text-cyan-600">
                <BookOpen className="h-10 w-10 transition-transform hover:scale-110" />
                Literature Syllabus
              </h1>
              <p className="text-lg text-gray-600">
                {isTeacher()
                  ? 'Manage syllabuses, courses, and sessions'
                  : 'View syllabuses, courses, and sessions'}
              </p>
            </div>
            {isTeacher() && (
              <Button
                onClick={handleCreateSyllabus}
                className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                Create New Syllabus
              </Button>
            )}
          </div>

          {/* Role Badge & Filters */}
          <div className="animate-slide-in mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <Badge
                variant={isTeacher() ? 'default' : 'secondary'}
                className={`text-base transition-all duration-200 hover:scale-105 ${
                  !isTeacher()
                    ? 'border-green-300 bg-green-100 text-green-800'
                    : ''
                }`}
              >
                <GraduationCap className="mr-1 h-4 w-4" />
                {isTeacher() ? 'Teacher/Admin' : 'Student'}
              </Badge>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search syllabuses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={
                    selectedSemester !== undefined
                      ? selectedSemester.toString()
                      : 'all'
                  }
                  onValueChange={(value) =>
                    setSelectedSemester(
                      value === 'all'
                        ? undefined
                        : (parseInt(value) as Semester)
                    )
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Semesters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    <SelectItem value={Semester.HocKiI.toString()}>
                      Học kỳ I
                    </SelectItem>
                    <SelectItem value={Semester.HocKiII.toString()}>
                      Học kỳ II
                    </SelectItem>
                    <SelectItem value={Semester.GiuaHocKiI.toString()}>
                      Giữa học kỳ I
                    </SelectItem>
                    <SelectItem value={Semester.GiuaHocKiII.toString()}>
                      Giữa học kỳ II
                    </SelectItem>
                    <SelectItem value={Semester.CuoiHocKiI.toString()}>
                      Cuối học kỳ I
                    </SelectItem>
                    <SelectItem value={Semester.CuoiHocKiII.toString()}>
                      Cuối học kỳ II
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Label htmlFor="active-only" className="text-sm">
                    Active Only
                  </Label>
                  <Switch
                    id="active-only"
                    checked={showActiveOnly === true}
                    onCheckedChange={(checked) =>
                      setShowActiveOnly(checked ? true : undefined)
                    }
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Stats Cards - Only for Teachers */}
          {isTeacher() &&
            !loadingSyllabuses &&
            syllabusesWithCourses.length > 0 && (
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                <Card
                  className="animate-scale-in border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ animationDelay: '0.1s', opacity: 0 }}
                >
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-blue-700">
                      Total Syllabuses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {syllabusesWithCourses.length}
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className="animate-scale-in border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ animationDelay: '0.2s', opacity: 0 }}
                >
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-cyan-700">
                      Total Courses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-cyan-600">
                      {syllabusesWithCourses.reduce(
                        (sum, s) => sum + s.coursesCount,
                        0
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className="animate-scale-in border-green-200 bg-gradient-to-br from-green-50 to-green-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ animationDelay: '0.3s', opacity: 0 }}
                >
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-green-700">
                      Active Syllabuses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {
                        syllabusesWithCourses.filter(
                          (s) => s.isActive !== false
                        ).length
                      }
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className="animate-scale-in border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ animationDelay: '0.4s', opacity: 0 }}
                >
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-purple-700">
                      Latest Syllabus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-purple-600">
                      {syllabusesWithCourses.length > 0 &&
                      syllabusesWithCourses[syllabusesWithCourses.length - 1]
                        .createdAt
                        ? new Date(
                            syllabusesWithCourses[
                              syllabusesWithCourses.length - 1
                            ].createdAt!
                          ).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          {/* Syllabuses Accordion */}
          {loadingSyllabuses ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : syllabusesError ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <BookOpen className="mb-4 h-16 w-16 text-red-300" />
                <h3 className="mb-2 text-xl font-semibold text-red-700">
                  Error loading syllabuses
                </h3>
                <p className="mb-4 text-gray-500">
                  An error occurred while loading syllabuses. Please try again.
                </p>
                <Button
                  onClick={() =>
                    queryClient.invalidateQueries({ queryKey: ['syllabuses'] })
                  }
                  variant="outline"
                  className="gap-2"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : syllabusesWithCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <BookOpen className="mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 text-xl font-semibold text-gray-700">
                  No Syllabuses Yet
                </h3>
                <p className="mb-4 text-gray-500">
                  {isTeacher()
                    ? 'Get started by creating your first syllabus'
                    : 'No syllabuses available yet'}
                </p>
                {isTeacher() && (
                  <Button onClick={handleCreateSyllabus} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Syllabus
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {syllabusesWithCourses.map((syllabus, index) => (
                <Card
                  key={syllabus.id}
                  className="animate-slide-in scroll-mt-4 shadow-lg transition-all duration-300 hover:shadow-2xl"
                  style={{
                    animationDelay: `${0.1 * (index + 1)}s`,
                    opacity: 0
                  }}
                >
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value={syllabus.id} className="border-none">
                      <CardHeader
                        className={`p-0 text-white ${
                          isTeacher()
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600'
                        }`}
                      >
                        <AccordionTrigger className="w-full px-6 py-4 hover:no-underline [&[data-state=open]>div>svg]:rotate-90">
                          <div className="flex w-full items-start justify-between gap-4">
                            <div className="flex flex-1 items-start gap-4 text-left">
                              <FolderOpen className="mt-1 h-6 w-6 flex-shrink-0 transition-all duration-300 hover:scale-125" />
                              <div className="flex-1">
                                <CardTitle className="mb-2 text-2xl">
                                  {syllabus.title}
                                </CardTitle>
                                <p
                                  className={`text-sm ${
                                    isTeacher()
                                      ? 'text-blue-100'
                                      : 'text-green-100'
                                  }`}
                                >
                                  {syllabus.description || 'No description'}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {syllabus.academicYear && (
                                    <Badge
                                      variant="secondary"
                                      className="flex items-center gap-1 bg-white/90 font-semibold text-blue-700 shadow-md transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-lg"
                                    >
                                      <Calendar className="h-3 w-3" />
                                      {syllabus.academicYear}
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1 bg-white/90 font-semibold text-cyan-700 shadow-md transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-lg"
                                  >
                                    <BookMarked className="h-3 w-3" />
                                    {getSemesterDisplayName(syllabus.semester)}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1 bg-white/90 font-semibold text-blue-700 shadow-md transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-lg"
                                  >
                                    <Library className="h-3 w-3" />
                                    {syllabus.coursesCount} Courses
                                  </Badge>
                                  {syllabus.isActive !== false && (
                                    <Badge
                                      variant="secondary"
                                      className="flex items-center gap-1 bg-green-500 font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-green-600 hover:shadow-lg"
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                      Active
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Syllabus Actions */}
                            {isTeacher() && (
                              <div className="flex gap-2">
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSyllabus(syllabus);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.stopPropagation();
                                      handleEditSyllabus(syllabus);
                                    }
                                  }}
                                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-white transition-all duration-200 hover:scale-110 hover:bg-white/20"
                                  title="Edit Syllabus"
                                >
                                  <Edit className="h-4 w-4" />
                                </div>
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!deleteSyllabusMutation.isPending) {
                                      handleDeleteSyllabus(syllabus);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.stopPropagation();
                                      if (!deleteSyllabusMutation.isPending) {
                                        handleDeleteSyllabus(syllabus);
                                      }
                                    }
                                  }}
                                  className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-white transition-all duration-200 hover:scale-110 hover:bg-white/20 ${
                                    deleteSyllabusMutation.isPending
                                      ? 'cursor-not-allowed opacity-50'
                                      : ''
                                  }`}
                                  title="Delete Syllabus"
                                >
                                  {deleteSyllabusMutation.isPending &&
                                  syllabusToDelete?.id === syllabus.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionTrigger>
                      </CardHeader>

                      <AccordionContent className="pb-0 transition-all duration-300 ease-in-out">
                        <CardContent className="space-y-4 pt-6">
                          {/* Create Course Button */}
                          {isTeacher() && (
                            <div className="flex justify-end">
                              <Button
                                onClick={() => handleCreateCourse(syllabus.id)}
                                variant="outline"
                                className="gap-2 border-slate-300 transition-all duration-200 hover:scale-105 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                                size="sm"
                              >
                                <Plus className="h-4 w-4" />
                                Create New Course
                              </Button>
                            </div>
                          )}

                          {/* Courses List */}
                          {syllabus.courses.length === 0 ? (
                            <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
                              <BookOpen className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                              <p className="font-medium text-slate-600">
                                No courses in this syllabus yet.
                              </p>
                              {isTeacher() && (
                                <p className="mt-1 text-sm text-slate-500">
                                  Click "Create New Course" to add one.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {syllabus.courses.map((course, courseIndex) => (
                                <div
                                  key={course.id}
                                  className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="mb-2 flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="border-blue-200 bg-blue-50 text-blue-700 transition-all duration-200 hover:scale-110"
                                        >
                                          #{courseIndex + 1}
                                        </Badge>
                                        <h4 className="font-semibold text-slate-800 transition-colors duration-200 group-hover:text-blue-700">
                                          {course.title}
                                        </h4>
                                        {course.courseCode ? (
                                          <Badge
                                            variant="outline"
                                            className="font-mono text-xs"
                                          >
                                            {course.courseCode}
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="border-orange-200 bg-orange-50 text-xs text-orange-700"
                                          >
                                            No Code
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="mb-3 text-sm leading-relaxed text-slate-600">
                                        {course.description || 'No description'}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                        <div className="text-xs text-slate-400">
                                          Created:{' '}
                                          {course.createdAt
                                            ? new Date(
                                                course.createdAt
                                              ).toLocaleDateString('vi-VN')
                                            : 'N/A'}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Course Actions */}
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          handleViewCourse(course.id)
                                        }
                                        title="View Course"
                                        className="transition-all duration-200 hover:scale-110 hover:bg-blue-50"
                                      >
                                        <Eye className="h-4 w-4 text-blue-600" />
                                      </Button>

                                      {isTeacher() && (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              navigate(
                                                `/course?edit=${course.id}`
                                              )
                                            }
                                            title="Edit Course"
                                            className="transition-all duration-200 hover:scale-110 hover:bg-green-50"
                                          >
                                            <Edit className="h-4 w-4 text-green-600" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              ))}
            </div>
          )}

          {/* Student View Info */}
          {!isTeacher() && syllabusesWithCourses.length > 0 && (
            <div className="mt-8">
              <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-green-100 p-2">
                      <GraduationCap className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 text-base font-semibold text-green-800">
                        Student View
                      </h3>
                      <p className="text-sm text-green-700">
                        Click on syllabus titles to expand and view courses. Use
                        the{' '}
                        <Eye className="mx-1 inline h-4 w-4 text-green-600" />{' '}
                        icon to view course details and access learning
                        materials.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        {/* Syllabus Create/Edit Dialog */}
        <Dialog open={syllabusDialogOpen} onOpenChange={setSyllabusDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSyllabus ? 'Edit Syllabus' : 'Create Syllabus'}
              </DialogTitle>
              <DialogDescription>
                {editingSyllabus
                  ? 'Update the syllabus information.'
                  : 'Create a new syllabus for the academic year.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter syllabus title (minimum 5 characters)"
                  value={syllabusForm.title}
                  onChange={(e) => {
                    setSyllabusForm({ ...syllabusForm, title: e.target.value });
                    if (formErrors.title) {
                      setFormErrors({ ...formErrors, title: undefined });
                    }
                  }}
                  className={formErrors.title ? 'border-red-500' : ''}
                />
                {formErrors.title && (
                  <p className="flex items-center gap-1 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {formErrors.title}
                  </p>
                )}
                {!formErrors.title && syllabusForm.title && (
                  <p className="text-xs text-gray-500">
                    {syllabusForm.title.length}/100 characters
                    {syllabusForm.title.length < 5 && ` (minimum 5 required)`}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year *</Label>
                  <Input
                    id="academicYear"
                    placeholder="e.g., 2024-2025"
                    value={syllabusForm.academicYear}
                    onChange={(e) => {
                      setSyllabusForm({
                        ...syllabusForm,
                        academicYear: e.target.value
                      });
                      if (formErrors.academicYear) {
                        setFormErrors({
                          ...formErrors,
                          academicYear: undefined
                        });
                      }
                    }}
                    className=""
                    maxLength={9}
                  />
                  {formErrors.academicYear && (
                    <p className="flex items-center gap-1 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      {formErrors.academicYear}
                    </p>
                  )}
                  {!formErrors.academicYear && (
                    <p className="text-xs text-gray-500">
                      Format: YYYY-YYYY (e.g., 2024-2025)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester *</Label>
                  <Select
                    value={syllabusForm.semester.toString()}
                    onValueChange={(value) => {
                      setSyllabusForm({
                        ...syllabusForm,
                        semester: parseInt(value) as Semester
                      });
                      if (formErrors.semester) {
                        setFormErrors({
                          ...formErrors,
                          semester: undefined
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="semester">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Semester.HocKiI.toString()}>
                        Học kỳ I
                      </SelectItem>
                      <SelectItem value={Semester.HocKiII.toString()}>
                        Học kỳ II
                      </SelectItem>
                      <SelectItem value={Semester.GiuaHocKiI.toString()}>
                        Giữa học kỳ I
                      </SelectItem>
                      <SelectItem value={Semester.GiuaHocKiII.toString()}>
                        Giữa học kỳ II
                      </SelectItem>
                      <SelectItem value={Semester.CuoiHocKiI.toString()}>
                        Cuối học kỳ I
                      </SelectItem>
                      <SelectItem value={Semester.CuoiHocKiII.toString()}>
                        Cuối học kỳ II
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Error message for Academic Year + Semester combination */}
              {formErrors.yearSemesterCombo && (
                <div
                  key={errorShakeKey}
                  className="animate-shake rounded-md border-2 border-red-400 bg-red-50 p-3"
                >
                  <p className="flex items-center gap-2 text-sm text-red-700">
                    <AlertTriangle className="h-5 w-5 animate-pulse" />
                    <span className="font-semibold">
                      {formErrors.yearSemesterCombo}
                    </span>
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Enter syllabus description (required, minimum 1 character)"
                  value={syllabusForm.description}
                  onChange={(e) => {
                    setSyllabusForm({
                      ...syllabusForm,
                      description: e.target.value
                    });
                    if (formErrors.description) {
                      setFormErrors({ ...formErrors, description: undefined });
                    }
                  }}
                  rows={4}
                  className={formErrors.description ? 'border-red-500' : ''}
                />
                {formErrors.description && (
                  <p className="flex items-center gap-1 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {formErrors.description}
                  </p>
                )}
                {!formErrors.description && syllabusForm.description && (
                  <p className="text-xs text-gray-500">
                    {syllabusForm.description.length}/500 characters
                  </p>
                )}
                {!editingSyllabus && !formErrors.description && (
                  <p className="text-xs text-gray-500">
                    Description is required for new syllabuses
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSyllabusDialogOpen(false);
                  setEditingSyllabus(null);
                  resetSyllabusForm();
                }}
                disabled={
                  createSyllabusMutation.isPending ||
                  updateSyllabusMutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSyllabus}
                disabled={
                  createSyllabusMutation.isPending ||
                  updateSyllabusMutation.isPending
                }
                className="bg-gradient-to-r from-cyan-600 to-blue-600"
              >
                {(createSyllabusMutation.isPending ||
                  updateSyllabusMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {createSyllabusMutation.isPending
                  ? 'Creating...'
                  : updateSyllabusMutation.isPending
                    ? 'Updating...'
                    : editingSyllabus
                      ? 'Update'
                      : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Syllabus</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the syllabus "
                {syllabusToDelete?.title}"? This action cannot be undone and
                will permanently delete the syllabus and all its associated
                courses.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deleteSyllabusMutation.isPending}
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSyllabusToDelete(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteSyllabusMutation.isPending}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleteSyllabusMutation.isPending ? (
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
}
