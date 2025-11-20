import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getSessionById, SessionDto } from '@/services/session.api';
import { getAllLessons } from '@/services/lesson.api';
import { toast } from 'sonner';

export default function ViewSessionPage() {
  const navigate = useNavigate();
  const { lessonId, sessionId } = useParams();

  // Fetch session data
  const {
    data: sessionData,
    isLoading: loadingSession,
    error
  } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      console.log('🔍 [ViewSessionPage] Fetching session:', sessionId);
      const result = await getSessionById(sessionId);
      console.log('📊 [ViewSessionPage] Session data:', result);
      return result;
    },
    enabled: !!sessionId,
    retry: false
  });

  // Fetch all lessons (from LessonServiceQuery) - contains LessonContexts and Activities
  const { data: lessonsData, isLoading: loadingLessons } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      console.log('🔵 [ViewSessionPage] Fetching all lessons');
      const result = await getAllLessons();
      console.log('📋 [ViewSessionPage] Lessons data:', result);
      return result;
    },
    retry: false
  });

  const session = sessionData?.data as SessionDto | undefined;

  // Get all lessons and filter by sessionId
  const allLessons = lessonsData?.data || [];
  const sessionLessons = allLessons.filter(
    (lesson) => lesson.sessionId === sessionId
  );

  // Extract LessonContexts and Activities from all lessons of this session
  const allLessonContexts = sessionLessons.flatMap(
    (lesson) => lesson.lessonContexts || []
  );
  const activities = sessionLessons.flatMap(
    (lesson) => lesson.activities || []
  );

  // Group contexts by level for hierarchical rendering
  const level1Contexts = allLessonContexts.filter((ctx) => ctx.level === 1);
  const level2Contexts = allLessonContexts.filter((ctx) => ctx.level === 2);
  const level3Contexts = allLessonContexts.filter((ctx) => ctx.level === 3);

  const isLoading = loadingSession || loadingLessons;

  // Debug logs to check data
  console.log('🔍 [ViewSessionPage] Debug - Session:', session);
  console.log(
    '📋 [ViewSessionPage] Debug - All Lesson Contexts:',
    allLessonContexts
  );
  console.log('📋 [ViewSessionPage] Debug - Level 1 Contexts:', level1Contexts);
  console.log('📋 [ViewSessionPage] Debug - Level 2 Contexts:', level2Contexts);
  console.log('🎯 [ViewSessionPage] Debug - Activities:', activities);
  console.log(
    '🎨 [ViewSessionPage] Will show fallback content:',
    level1Contexts.length === 0 && activities.length === 0
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.info('Tính năng tải xuống PDF đang được phát triển');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="mx-auto max-w-5xl px-6 py-12">
          <div className="mb-8">
            <Skeleton className="h-12 w-40" />
          </div>
          <div className="rounded-lg bg-white p-16 shadow-2xl">
            <Skeleton className="mx-auto mb-6 h-14 w-3/4" />
            <Skeleton className="mx-auto mb-10 h-8 w-1/2" />
            <Skeleton className="mb-6 h-40 w-full" />
            <Skeleton className="mb-6 h-40 w-full" />
            <Skeleton className="mb-6 h-40 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="mx-auto max-w-5xl px-6 py-12">
          <Button
            variant="ghost"
            onClick={() => navigate('/syllabus')}
            className="mb-8 gap-2 text-base"
          >
            <ArrowLeft className="h-5 w-5" />
            Quay lại
          </Button>
          <div className="rounded-lg bg-white p-20 text-center shadow-2xl">
            <h2 className="mb-3 text-3xl font-bold text-slate-700">
              Không tìm thấy session
            </h2>
            <p className="text-lg text-slate-500">
              Vui lòng quay lại trang danh sách bài học
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Render session document in curriculum format
  const renderDocument = () => {
    return (
      <div className="space-y-12">
        {/* Document Title */}
        <div className="border-b-4 border-slate-800 pb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold uppercase tracking-wide text-slate-900">
            {session?.title || 'Session Title'}
          </h1>
          <p className="mb-2 text-lg text-slate-600">{session?.description}</p>
          {session?.durationMinutes && (
            <div className="mt-3 flex items-center justify-center gap-2 text-base font-medium text-slate-500">
              <Clock className="h-5 w-5" />
              {session.durationMinutes} phút
            </div>
          )}
        </div>

        {/* Render Lesson Contexts dynamically with hierarchy */}
        {level1Contexts.map((level1Context) => {
          // Find all Level 2 contexts that belong to this Level 1
          const childContexts = level2Contexts.filter(
            (ctx) => ctx.parentId === level1Context.lessonContextId
          );

          return (
            <section key={level1Context.lessonContextId} className="space-y-6">
              {/* Level 1 - Main Title (I, II, III) */}
              <h2 className="border-b-2 border-slate-400 pb-3 text-3xl font-bold uppercase tracking-wide text-slate-900">
                {level1Context.title}
              </h2>

              {/* Level 2 - SubSections (1, 2, 3) */}
              <div className="space-y-6 pl-6">
                {childContexts.map((level2Context) => {
                  // Find all Level 3 contexts that belong to this Level 2
                  const grandChildContexts = level3Contexts.filter(
                    (ctx) => ctx.parentId === level2Context.lessonContextId
                  );

                  return (
                    <div
                      key={level2Context.lessonContextId}
                      className="space-y-3"
                    >
                      <h3 className="text-xl font-bold text-slate-800">
                        {level2Context.title}
                      </h3>
                      {level2Context.content && (
                        <div className="whitespace-pre-line pl-6 text-base leading-relaxed text-slate-700">
                          {level2Context.content}
                        </div>
                      )}

                      {/* Level 3 - Sub-SubSections (a, b, c) */}
                      {grandChildContexts.length > 0 && (
                        <div className="space-y-3 pl-6">
                          {grandChildContexts.map((level3Context) => (
                            <div
                              key={level3Context.lessonContextId}
                              className="space-y-2"
                            >
                              <h4 className="text-lg font-semibold text-slate-700">
                                {level3Context.title}
                              </h4>
                              {level3Context.content && (
                                <div className="whitespace-pre-line pl-6 text-base leading-relaxed text-slate-600">
                                  {level3Context.content}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Fallback hardcoded sections if no lesson contexts from API */}
        {level1Contexts.length === 0 && (
          <>
            {/* I. MỤC TIÊU */}
            <section className="space-y-6">
              <h2 className="border-b-2 border-slate-400 pb-3 text-3xl font-bold uppercase tracking-wide text-slate-900">
                I. MỤC TIÊU
              </h2>
              <div className="space-y-6 pl-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-800">
                    1. Kiến thức:
                  </h3>
                  <div className="whitespace-pre-line pl-6 text-base leading-relaxed text-slate-700">
                    - Học sinh hiểu được khái niệm và ý nghĩa của chủ đề học tập
                    - Nắm được các kiến thức cơ bản liên quan đến bài học
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-800">
                    2. Năng lực:
                  </h3>
                  <div className="whitespace-pre-line pl-6 text-base leading-relaxed text-slate-700">
                    - Phát triển năng lực tư duy logic và phân tích - Rèn luyện
                    kỹ năng làm việc nhóm và trình bày
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-800">
                    3. Phẩm chất:
                  </h3>
                  <div className="whitespace-pre-line pl-6 text-base leading-relaxed text-slate-700">
                    - Yêu quý trân trọng những kinh nghiệm của lớp ngữ và thiên
                    nhiên và lao động sản xuất - Vận dụng được ở mức độ nhất
                    định một số cấu tục ngữ và thiên nhiên và lao động sản xuất
                    vào đời sống
                  </div>
                </div>
              </div>
            </section>

            {/* II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU */}
            <section className="space-y-6">
              <h2 className="border-b-2 border-slate-400 pb-3 text-3xl font-bold uppercase tracking-wide text-slate-900">
                II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
              </h2>
              <div className="space-y-6 pl-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-800">
                    1. Chuẩn bị của giáo viên:
                  </h3>
                  <div className="whitespace-pre-line pl-6 text-base leading-relaxed text-slate-700">
                    - Kế hoạch bài học - Học liệu: Đồ dùng dạy học, phiếu học
                    tập, một số cấu tục ngữ cùng chủ đề nhắc học sinh soạn bài
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-800">
                    2. Chuẩn bị của học sinh:
                  </h3>
                  <div className="whitespace-pre-line pl-6 text-base leading-relaxed text-slate-700">
                    - Soạn bài - Sưu tầm các cấu tục ngữ cùng chủ đề
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Render Activities dynamically */}
        {activities.length > 0 && (
          <section className="space-y-8">
            <h2 className="border-b-2 border-slate-400 pb-3 text-3xl font-bold uppercase tracking-wide text-slate-900">
              III. TIẾN TRÌNH CÁC HOẠT ĐỘNG DẠY HỌC
            </h2>

            {activities.map((activity) => (
              <div key={activity.activityId} className="space-y-5 pl-6">
                <h3 className="mb-6 text-2xl font-bold text-slate-800">
                  {activity.title}
                </h3>

                {/* Two Column Table Layout */}
                <div className="overflow-hidden rounded-lg border-2 border-slate-400 shadow-md">
                  {/* Table Header */}
                  <div className="grid grid-cols-2 border-b-2 border-slate-400 bg-slate-200">
                    <div className="border-r-2 border-slate-400 p-5">
                      <h4 className="text-center text-lg font-bold uppercase tracking-wide text-slate-900">
                        HOẠT ĐỘNG CỦA THẦY VÀ TRÒ
                      </h4>
                    </div>
                    <div className="p-5">
                      <h4 className="text-center text-lg font-bold uppercase tracking-wide text-slate-900">
                        SẢN PHẨM DỰ KIẾN
                      </h4>
                    </div>
                  </div>

                  {/* Table Content */}
                  <div className="grid grid-cols-2">
                    {/* Left Column - Activity Steps */}
                    <div className="space-y-6 border-r-2 border-slate-400 bg-white p-7">
                      <div className="space-y-2">
                        <div className="whitespace-pre-line text-base leading-relaxed text-slate-700">
                          {activity.instructions ||
                            activity.description ||
                            'Hoạt động sẽ được cập nhật'}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Expected Outcomes */}
                    <div className="bg-slate-50 p-7">
                      <div className="whitespace-pre-line text-base leading-relaxed text-slate-700">
                        {activity.description ||
                          'Kết quả học tập dự kiến sẽ được cập nhật'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Fallback hardcoded activities if no activities from API */}
        {activities.length === 0 && (
          <section className="space-y-8">
            <h2 className="border-b-2 border-slate-400 pb-3 text-3xl font-bold uppercase tracking-wide text-slate-900">
              III. TIẾN TRÌNH CÁC HOẠT ĐỘNG DẠY HỌC
            </h2>

            {/* A. HOẠT ĐỘNG KHỞI ĐỘNG */}
            <div className="space-y-5 pl-6">
              <h3 className="mb-6 text-2xl font-bold text-slate-800">
                A. HOẠT ĐỘNG KHỞI ĐỘNG
              </h3>
              <div className="whitespace-pre-line pl-6 text-base leading-relaxed text-slate-700">
                Chơi trò sơ gì
              </div>
            </div>

            {/* Hoạt động 1 */}
            <div className="space-y-5 pl-6">
              <h3 className="mb-6 text-2xl font-bold text-slate-800">
                Hoạt động 1
              </h3>

              {/* Two Column Table Layout */}
              <div className="overflow-hidden rounded-lg border-2 border-slate-400 shadow-md">
                {/* Table Header */}
                <div className="grid grid-cols-2 border-b-2 border-slate-400 bg-slate-200">
                  <div className="border-r-2 border-slate-400 p-5">
                    <h4 className="text-center text-lg font-bold uppercase tracking-wide text-slate-900">
                      HOẠT ĐỘNG CỦA THẦY VÀ TRÒ
                    </h4>
                  </div>
                  <div className="p-5">
                    <h4 className="text-center text-lg font-bold uppercase tracking-wide text-slate-900">
                      SẢN PHẨM DỰ KIẾN
                    </h4>
                  </div>
                </div>

                {/* Table Content */}
                <div className="grid grid-cols-2">
                  {/* Left Column - Activity Steps */}
                  <div className="space-y-6 border-r-2 border-slate-400 bg-white p-7">
                    <div className="space-y-2">
                      <p className="text-base font-bold text-slate-800">
                        Bước 1: Chuyển giao nhiệm vụ
                      </p>
                      <p className="whitespace-pre-line pl-4 text-base leading-relaxed text-slate-700">
                        a. Mục tiêu: Giúp học sinh hiểu thế nào là tục ngữ và
                        nội dung, chủ đề của các tục ngữ về nội dung của vấn đề
                        nói rằng b. Nội dung HS quan sát SGK để tìm hiểu nội
                        dung
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Expected Outcomes */}
                  <div className="bg-slate-50 p-7">
                    <p className="whitespace-pre-line text-base leading-relaxed text-slate-700">
                      - Tục ngữ là những câu nói dân gian ngắn gọn, ấn định, có
                      nhịp điệu, hình ảnh, đúc kết những bài học của nhân dân về
                      - Quy luật của thiên nhiên - Kinh nghiệm lao động sản xuất
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      {/* Action Bar - Hidden when printing */}
      <div className="sticky top-0 z-10 border-b-2 border-slate-200 bg-white shadow-md print:hidden">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="h-12 gap-2 px-6 text-base"
            >
              <ArrowLeft className="h-5 w-5" />
              Quay lại
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="h-12 gap-2 border-2 px-6 text-base"
              >
                <Download className="h-5 w-5" />
                Tải xuống
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="h-12 gap-2 border-2 px-6 text-base"
              >
                <Printer className="h-5 w-5" />
                In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Container - Google Docs Style */}
      <main className="mx-auto max-w-5xl px-6 py-12 print:py-0">
        {/* Paper-like Document */}
        <div
          className="rounded-lg bg-white shadow-2xl print:rounded-none print:shadow-none"
          style={{
            minHeight: '29.7cm', // A4 height
            padding: '3.5cm 3cm', // Larger margins
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            lineHeight: '1.75'
          }}
        >
          {renderDocument()}
        </div>

        {/* Spacer for bottom */}
        <div className="h-16 print:hidden"></div>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          @page {
            margin: 2cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
