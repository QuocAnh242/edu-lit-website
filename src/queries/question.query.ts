import BaseRequest from '@/config/axios.config';
import { useMutation, useQuery } from '@tanstack/react-query';

// Question Types
export enum QuestionType {
  Paragraph = 1,
  Multichoice = 2
}

export interface CreateQuestionRequest {
  title: string;
  body: string;
  questionType: QuestionType;
  metadata?: string;
  tags?: string;
  version?: number;
  isPublished?: boolean;
  questionBankId: string;
  authorId: string;
}

export interface CreateQuestionOptionRequest {
  optionText: string;
  isCorrect: boolean;
  orderIdx: number;
  questionId: string;
}

export interface QuestionBankDto {
  questionBanksId: string;
  title: string;
  description?: string;
  subject?: string;
  createdAt: string;
  ownerId: string;
}

export interface QuestionDto {
  questionId: string;
  title: string;
  body: string;
  questionType: QuestionType;
  metadata?: string;
  tags?: string;
  version: number;
  createdAt: string;
  updatedAt?: string;
  isPublished: boolean;
  questionBankId: string;
  authorId: string;
}

export interface QuestionResponse {
  success: boolean;
  message: string;
  data: string | QuestionDto | QuestionDto[] | QuestionBankDto[];
}

// Get all question banks
export const useGetQuestionBanks = () => {
  return useQuery({
    queryKey: ['question-banks'],
    queryFn: async () => {
      return BaseRequest.Get('/api/v1/questionbank');
    }
  });
};

// Create question
export const useCreateQuestion = () => {
  return useMutation({
    mutationKey: ['create-question'],
    mutationFn: async (data: CreateQuestionRequest) => {
      return BaseRequest.Post('/api/v1/question', data);
    }
  });
};

// Create question option
export const useCreateQuestionOption = () => {
  return useMutation({
    mutationKey: ['create-question-option'],
    mutationFn: async (data: CreateQuestionOptionRequest) => {
      return BaseRequest.Post('/api/v1/questionoption', data);
    }
  });
};

// Get all questions
export const useGetAllQuestions = () => {
  return useQuery({
    queryKey: ['all-questions'],
    queryFn: async () => {
      return BaseRequest.Get('/api/v1/question');
    }
  });
};

// Get question by ID
export const useGetQuestionById = (id: string) => {
  return useQuery({
    queryKey: ['question', id],
    queryFn: async () => {
      return BaseRequest.Get(`/api/v1/question/${id}`);
    },
    enabled: !!id
  });
};

// Get question options by question ID
export const useGetQuestionOptions = (questionId: string) => {
  return useQuery({
    queryKey: ['question-options', questionId],
    queryFn: async () => {
      return BaseRequest.Get(`/api/v1/questionoption/question/${questionId}`);
    },
    enabled: !!questionId
  });
};
