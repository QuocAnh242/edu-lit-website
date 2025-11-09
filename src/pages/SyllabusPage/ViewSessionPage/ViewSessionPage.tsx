import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Session } from '@/constants/mock-lessons';
import { getLessonById } from '@/utils/lesson-storage';

export default function ViewSessionPage() {
  const navigate = useNavigate();
  const { lessonId, sessionId } = useParams();
  const { toast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Load from localStorage
        await new Promise((resolve) => setTimeout(resolve, 500));

        const lesson = getLessonById(lessonId || '');
        const sessionData = lesson?.sessions.find((s) => s.id === sessionId);

        if (!sessionData) {
          throw new Error('Session not found');
        }

        setSession(sessionData);
      } catch (error) {
        toast({
          title: 'Lỗi',
          description: 'Không thể tải dữ liệu session',
          variant: 'destructive'
        });
        navigate('/syllabus');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [lessonId, sessionId, navigate, toast]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast({
      title: 'Đang phát triển',
      description: 'Tính năng tải xuống PDF đang được phát triển'
    });
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

  // Render Alternative Lesson Plan (from CreateSessionPage format)
  const renderDocument = () => {
    if (
      !session.alternativeLessonPlans ||
      session.alternativeLessonPlans.length === 0
    ) {
      return (
        <div className="py-20 text-center">
          <p className="text-2xl font-medium text-slate-500">
            Chưa có nội dung giáo án
          </p>
          <p className="mt-3 text-lg text-slate-400">
            Vui lòng thêm nội dung giáo án từ trang tạo session
          </p>
        </div>
      );
    }

    const plan = session.alternativeLessonPlans[0];

    return (
      <div className="space-y-12">
        {/* Document Title */}
        <div className="border-b-4 border-slate-800 pb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold uppercase tracking-wide text-slate-900">
            {plan.title}
          </h1>
          <p className="mb-2 text-lg text-slate-600">{session.description}</p>
          <p className="mt-3 text-base font-medium text-slate-500">
            {session.duration}
          </p>
        </div>

        {/* Lesson Contexts - Main Content Sections */}
        {plan.lessonContexts.map((context) => (
          <section key={context.id} className="space-y-6">
            {/* Main Section Title */}
            <h2 className="border-b-2 border-slate-400 pb-3 text-3xl font-bold uppercase tracking-wide text-slate-900">
              {context.mainTitle}
            </h2>

            {/* Sub-sections */}
            <div className="space-y-6 pl-6">
              {context.subSections.map((sub) => (
                <div key={sub.id} className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-800">
                    {sub.title}
                  </h3>
                  <div className="whitespace-pre-line pl-6 text-base leading-relaxed text-slate-700">
                    {sub.content}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Activities Section */}
        {plan.activities.length > 0 && (
          <section className="space-y-8">
            <h2 className="border-b-2 border-slate-400 pb-3 text-3xl font-bold uppercase tracking-wide text-slate-900">
              III. TIẾN TRÌNH CÁC HOẠT ĐỘNG DẠY HỌC
            </h2>

            {plan.activities.map((activity, actIdx) => (
              <div key={activity.id} className="space-y-5 pl-6">
                {/* Activity Header */}
                <h3 className="mb-6 text-2xl font-bold text-slate-800">
                  Hoạt động {actIdx + 1}
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
                    {/* Left Column - 4 Steps */}
                    <div className="space-y-6 border-r-2 border-slate-400 bg-white p-7">
                      {activity.step1 && (
                        <div className="space-y-2">
                          <p className="text-base font-bold text-slate-800">
                            Bước 1: Chuyển giao nhiệm vụ
                          </p>
                          <p className="whitespace-pre-line pl-4 text-base leading-relaxed text-slate-700">
                            {activity.step1}
                          </p>
                        </div>
                      )}

                      {activity.step2 && (
                        <div className="space-y-2">
                          <p className="text-base font-bold text-slate-800">
                            Bước 2: Thực hiện nhiệm vụ
                          </p>
                          <p className="whitespace-pre-line pl-4 text-base leading-relaxed text-slate-700">
                            {activity.step2}
                          </p>
                        </div>
                      )}

                      {activity.step3 && (
                        <div className="space-y-2">
                          <p className="text-base font-bold text-slate-800">
                            Bước 3: Báo cáo, thảo luận
                          </p>
                          <p className="whitespace-pre-line pl-4 text-base leading-relaxed text-slate-700">
                            {activity.step3}
                          </p>
                        </div>
                      )}

                      {activity.step4 && (
                        <div className="space-y-2">
                          <p className="text-base font-bold text-slate-800">
                            Bước 4: Kết luận, nhận định
                          </p>
                          <p className="whitespace-pre-line pl-4 text-base leading-relaxed text-slate-700">
                            {activity.step4}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Expected Outcomes */}
                    <div className="bg-slate-50 p-7">
                      <p className="whitespace-pre-line text-base leading-relaxed text-slate-700">
                        {activity.expectedOutcome}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
              onClick={() => navigate('/syllabus')}
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
