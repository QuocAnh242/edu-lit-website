import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, BookOpen, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getLessonById, updateLesson } from '@/utils/lesson-storage';

export default function EditLessonPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('');
  const [semester, setSemester] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch lesson data from localStorage
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        // Load from localStorage
        await new Promise((resolve) => setTimeout(resolve, 500));

        const lesson = getLessonById(lessonId || '');

        if (!lesson) {
          throw new Error('Course not found');
        }

        // Extract grade number from "Lớp X" format
        const gradeMatch = lesson.grade.match(/\d+/);
        const gradeNum = gradeMatch ? gradeMatch[0] : '';

        // Extract semester number from "Học kỳ X" format
        const semesterNum = lesson.semester.includes('I') ? '1' : '2';

        setTitle(lesson.title);
        setDescription(lesson.description);
        setGrade(gradeNum);
        setSemester(semesterNum);
      } catch (error) {
        console.error('Error loading course:', error);
        toast({
          title: 'Error',
          description: 'Failed to load course data',
          variant: 'destructive'
        });
        navigate('/syllabus');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Course title is required',
        variant: 'destructive'
      });
      return;
    }

    if (!grade) {
      toast({
        title: 'Error',
        description: 'Please select a grade',
        variant: 'destructive'
      });
      return;
    }

    if (!semester) {
      toast({
        title: 'Error',
        description: 'Please select a semester',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current course from localStorage
      const currentCourse = getLessonById(lessonId || '');

      if (!currentCourse) {
        throw new Error('Course not found');
      }

      // Update course with new data (preserve sessions)
      const updatedCourse = {
        ...currentCourse,
        title: title.trim(),
        description: description.trim(),
        grade: `Lớp ${grade}`,
        semester: semester === '1' ? 'Học kỳ I' : 'Học kỳ II'
        // Keep existing sessions and other properties
      };

      // Save to localStorage
      updateLesson(lessonId || '', updatedCourse);

      // Mock delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: 'Success',
        description: 'Course updated successfully!',
        className: 'bg-green-50 border-green-200'
      });

      // Navigate back to syllabus list
      navigate('/syllabus');
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to update course. Please try again.',
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
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/syllabus')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Syllabus
          </Button>

          <div className="mb-8">
            <Skeleton className="mb-2 h-12 w-96" />
            <Skeleton className="h-6 w-full max-w-md" />
          </div>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
              <Skeleton className="h-8 w-64 bg-white/20" />
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
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
          onClick={() => navigate('/syllabus')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Syllabus
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold text-green-600">
            <BookOpen className="h-10 w-10" />
            Edit Course
          </h1>
          <p className="text-lg text-gray-600">
            Update course information for your literature curriculum
          </p>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
              <CardTitle className="text-2xl">Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Course Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">
                  Course Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Văn học Việt Nam hiện đại (1945-1975)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base"
                  required
                />
                <p className="text-sm text-slate-500">
                  Enter a clear, descriptive title for the course
                </p>
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
                  placeholder="Provide a brief overview of what this course covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="text-base"
                />
                <p className="text-sm text-slate-500">
                  Optional: Add details about the course scope and objectives
                </p>
              </div>

              {/* Grade and Semester Row */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Grade */}
                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-base font-semibold">
                    Grade Level *
                  </Label>
                  <Select value={grade} onValueChange={setGrade} required>
                    <SelectTrigger id="grade" className="text-base">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Lớp 10</SelectItem>
                      <SelectItem value="11">Lớp 11</SelectItem>
                      <SelectItem value="12">Lớp 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Semester */}
                <div className="space-y-2">
                  <Label htmlFor="semester" className="text-base font-semibold">
                    Semester *
                  </Label>
                  <Select value={semester} onValueChange={setSemester} required>
                    <SelectTrigger id="semester" className="text-base">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Học kỳ I</SelectItem>
                      <SelectItem value="2">Học kỳ II</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Warning Banner */}
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm text-orange-700">
                  ⚠️ <strong>Warning:</strong> Updating this course will affect
                  all associated sessions and lesson plans. Make sure you review
                  the changes carefully.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/syllabus')}
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
                      Update Course
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Preview Card */}
        <Card className="mt-8 shadow-lg">
          <CardHeader className="bg-slate-100">
            <CardTitle className="text-lg text-slate-700">Preview</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-semibold text-slate-500">
                  Title:
                </span>
                <p className="text-lg font-semibold text-slate-800">
                  {title || (
                    <span className="italic text-slate-400">Not set yet</span>
                  )}
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
              <div className="flex gap-4">
                {grade && (
                  <div>
                    <span className="text-sm font-semibold text-slate-500">
                      Grade:
                    </span>
                    <p className="text-slate-700">Lớp {grade}</p>
                  </div>
                )}
                {semester && (
                  <div>
                    <span className="text-sm font-semibold text-slate-500">
                      Semester:
                    </span>
                    <p className="text-slate-700">
                      Học kỳ {semester === '1' ? 'I' : 'II'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
