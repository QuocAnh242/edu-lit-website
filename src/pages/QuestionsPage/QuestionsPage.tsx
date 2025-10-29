import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Plus, BookOpen, Edit, Trash2, Eye } from 'lucide-react';
import {
  useGetAllQuestions,
  QuestionType,
  QuestionDto
} from '@/queries/question.query';
import { Skeleton } from '@/components/ui/skeleton';

export default function QuestionsPage() {
  const navigate = useNavigate();
  const { data: questionsData, isLoading } = useGetAllQuestions();
  const questions = (questionsData?.data || []) as QuestionDto[];

  const getQuestionTypeLabel = (type: number) => {
    return type === QuestionType.Paragraph ? 'Paragraph' : 'Multiple Choice';
  };

  const getQuestionTypeBadge = (type: number) => {
    return type === QuestionType.Paragraph ? (
      <Badge variant="secondary">📝 Paragraph</Badge>
    ) : (
      <Badge variant="default">☑️ Multiple Choice</Badge>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="mb-2 text-4xl font-bold text-cyan-600"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Questions Bank
            </h1>
            <p
              className="text-lg text-gray-600"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Manage your questions collection
            </p>
          </div>
          <Button
            onClick={() => navigate('/questions/create')}
            className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            <Plus className="h-5 w-5" />
            Create Question
          </Button>
        </div>

        {/* Questions Table */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              All Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <BookOpen className="mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 text-xl font-semibold text-gray-700">
                  No questions yet
                </h3>
                <p className="mb-4 text-gray-500">
                  Get started by creating your first question
                </p>
                <Button
                  onClick={() => navigate('/questions/create')}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create First Question
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question: QuestionDto) => (
                    <TableRow key={question.questionId}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="text-sm font-semibold">
                            {question.title}
                          </div>
                          {question.tags && (
                            <div className="mt-1 text-xs text-gray-500">
                              Tags: {question.tags}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getQuestionTypeBadge(question.questionType)}
                      </TableCell>
                      <TableCell>
                        {question.isPublished ? (
                          <Badge
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(question.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
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

        {/* Stats Cards */}
        {!isLoading && questions.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-600">
                  {questions.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Published
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {questions.filter((q: QuestionDto) => q.isPublished).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Drafts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {questions.filter((q: QuestionDto) => !q.isPublished).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
