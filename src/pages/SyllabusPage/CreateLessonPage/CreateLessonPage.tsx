import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, BookOpen, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { addLesson, generateId } from '@/utils/lesson-storage';

export default function CreateLessonPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('');
  const [semester, setSemester] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Create new course object
      const newCourse = {
        id: generateId('course'),
        title: title.trim(),
        description: description.trim(),
        grade: `Lớp ${grade}`,
        semester: semester === '1' ? 'Học kỳ I' : 'Học kỳ II',
        subject: 'Ngữ Văn',
        createdAt: new Date().toISOString(),
        sessions: []
      };

      // Save to localStorage
      addLesson(newCourse);

      // Mock delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: 'Success',
        description: 'Course created successfully!',
        className: 'bg-green-50 border-green-200'
      });

      // Navigate back to syllabus list
      navigate('/syllabus');
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to create course. Please try again.',
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
          onClick={() => navigate('/syllabus')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Syllabus
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold text-cyan-600">
            <BookOpen className="h-10 w-10" />
            Create New Course
          </h1>
          <p className="text-lg text-gray-600">
            Set up a new course for your literature curriculum
          </p>
        </div>

        {/* Create Form */}
        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
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

              {/* Info Banner */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  💡 <strong>Note:</strong> After creating the course, you can
                  add sessions and lesson plans to organize your teaching
                  materials.
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
                  className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Creating...' : 'Create Course'}
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
