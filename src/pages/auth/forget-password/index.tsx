'use client';

import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import Bg from '@/assets/bg.jpg';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { forgetPassword, resetPassword } from '@/services/auth.api';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form validation schema for forget password
const forgetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email là bắt buộc' })
    .email({ message: 'Email không hợp lệ' })
});

// Form validation schema for reset password
const resetPasswordSchema = z
  .object({
    email: z.string().email({ message: 'Email không hợp lệ' }),
    otpCode: z
      .string()
      .min(6, { message: 'Mã OTP phải có 6 ký tự' })
      .max(6, { message: 'Mã OTP phải có 6 ký tự' })
      .regex(/^\d+$/, { message: 'Mã OTP chỉ được chứa số' }),
    newPassword: z
      .string()
      .min(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' }),
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
  });

type ForgetPasswordFormValues = z.infer<typeof forgetPasswordSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ForgetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const forgetPasswordForm = useForm<ForgetPasswordFormValues>({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
      otpCode: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onSubmitForgetPassword = async (data: ForgetPasswordFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call forget password API
      const response = await forgetPassword({
        email: data.email
      });

      if (response.success) {
        setOtpSent(true);
        setUserEmail(data.email);
        // Pre-fill email in reset password form
        resetPasswordForm.setValue('email', data.email);
        // Show success toast
        toast({
          title: 'Yêu cầu thành công!',
          description:
            response.message ||
            'Nếu email tồn tại, mã OTP đã được gửi đến email của bạn.',
          variant: 'default'
        });
      } else {
        setError(response.message || 'Yêu cầu thất bại. Vui lòng thử lại.');
        toast({
          title: 'Yêu cầu thất bại',
          description: response.message || 'Vui lòng thử lại.',
          variant: 'destructive'
        });
      }
    } catch (err: unknown) {
      console.error('Forget password error:', err);

      // Handle error response
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';

      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
      ) {
        errorMessage = String(err.response.data.message);
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Show error toast
      toast({
        title: 'Lỗi yêu cầu',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitResetPassword = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call reset password API
      const response = await resetPassword({
        email: data.email,
        otpCode: data.otpCode,
        newPassword: data.newPassword
      });

      if (response.success) {
        setResetSuccess(true);
        // Show success toast
        toast({
          title: 'Đặt lại mật khẩu thành công!',
          description:
            response.message || 'Mật khẩu của bạn đã được đặt lại thành công.',
          variant: 'default'
        });

        // Redirect to signin after 2 seconds
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      } else {
        setError(
          response.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.'
        );
        toast({
          title: 'Đặt lại mật khẩu thất bại',
          description: response.message || 'Vui lòng thử lại.',
          variant: 'destructive'
        });
      }
    } catch (err: unknown) {
      console.error('Reset password error:', err);

      // Handle error response
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';

      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
      ) {
        errorMessage = String(err.response.data.message);
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Show error toast
      toast({
        title: 'Lỗi đặt lại mật khẩu',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        to="/signin"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute right-4 top-4 hidden md:right-8 md:top-8'
        )}
      >
        Đăng nhập
      </Link>

      {/* Left column with background image */}
      <div className="relative hidden h-full flex-col bg-muted p-10 dark:border-r lg:flex">
        <div
          className="absolute inset-0 bg-secondary"
          style={{
            backgroundImage: `url(${Bg})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        ></div>

        <div className="relative z-20 flex items-center text-lg font-medium text-current">
          EduLit
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg text-current">Nền tảng giáo dục hiện đại</p>
            <p className="text-sm text-current opacity-80">
              Tham gia cùng hàng nghìn học viên đang học tập và phát triển
            </p>
          </blockquote>
        </div>
      </div>

      {/* Right column with forget password form */}
      <div className="flex h-full items-center justify-center p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {resetSuccess
                ? 'Đặt lại mật khẩu thành công'
                : otpSent
                  ? 'Đặt lại mật khẩu'
                  : 'Quên mật khẩu'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {resetSuccess
                ? 'Mật khẩu của bạn đã được đặt lại thành công. Đang chuyển đến trang đăng nhập...'
                : otpSent
                  ? 'Nhập mã OTP và mật khẩu mới của bạn'
                  : 'Nhập email của bạn để nhận mã OTP đặt lại mật khẩu'}
            </p>
          </div>

          {/* Error Alert */}
          {error && !resetSuccess && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert for OTP Sent */}
          {otpSent && !resetSuccess && (
            <Alert className="border-green-500 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Mã OTP đã được gửi đến email <strong>{userEmail}</strong>. Vui
                lòng kiểm tra hộp thư và nhập mã OTP bên dưới.
              </AlertDescription>
            </Alert>
          )}

          {/* Success Alert for Password Reset */}
          {resetSuccess && (
            <Alert className="border-green-500 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Mật khẩu của bạn đã được đặt lại thành công. Bạn sẽ được chuyển
                đến trang đăng nhập trong giây lát.
              </AlertDescription>
            </Alert>
          )}

          {/* Forget Password Form */}
          {!otpSent && !resetSuccess && (
            <Form {...forgetPasswordForm}>
              <form
                onSubmit={forgetPasswordForm.handleSubmit(
                  onSubmitForgetPassword
                )}
                className="w-full space-y-4"
              >
                {/* Email Field */}
                <FormField
                  control={forgetPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Nhập địa chỉ email..."
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  disabled={isLoading}
                  className="ml-auto w-full"
                  type="submit"
                >
                  {isLoading ? 'Đang xử lý...' : 'Gửi mã OTP'}
                </Button>
              </form>
            </Form>
          )}

          {/* Reset Password Form */}
          {otpSent && !resetSuccess && (
            <Form {...resetPasswordForm}>
              <form
                onSubmit={resetPasswordForm.handleSubmit(onSubmitResetPassword)}
                className="w-full space-y-4"
              >
                {/* Email Field (Disabled) */}
                <FormField
                  control={resetPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          disabled
                          className="bg-muted"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* OTP Code Field */}
                <FormField
                  control={resetPasswordForm.control}
                  name="otpCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã OTP</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Nhập mã OTP 6 số..."
                          disabled={isLoading}
                          maxLength={6}
                          className="text-center text-lg tracking-widest"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* New Password Field */}
                <FormField
                  control={resetPasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu mới</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Nhập mật khẩu mới..."
                            disabled={isLoading}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password Field */}
                <FormField
                  control={resetPasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Nhập lại mật khẩu mới..."
                            disabled={isLoading}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  disabled={isLoading}
                  className="ml-auto w-full"
                  type="submit"
                >
                  {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </Button>
              </form>
            </Form>
          )}

          {/* Action Buttons for OTP Sent */}
          {otpSent && !resetSuccess && (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setOtpSent(false);
                  forgetPasswordForm.reset();
                  resetPasswordForm.reset();
                  setError(null);
                }}
                disabled={isLoading}
              >
                Quay lại
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={async () => {
                  const email = resetPasswordForm.getValues('email');
                  if (email) {
                    await onSubmitForgetPassword({ email });
                  }
                }}
                disabled={isLoading}
              >
                Gửi lại mã OTP
              </Button>
            </div>
          )}

          {/* Back to sign in link */}
          {!otpSent && !resetSuccess && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Nhớ mật khẩu?{' '}
                <Link
                  to="/signin"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Bằng cách tiếp tục, bạn đồng ý với{' '}
            <a className="underline underline-offset-4 hover:text-primary">
              điều khoản dịch vụ
            </a>{' '}
            và{' '}
            <a className="underline underline-offset-4 hover:text-primary">
              chính sách bảo mật của chúng tôi
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
