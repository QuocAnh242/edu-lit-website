'use client';

import type React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { resetPassword } from '@/services/auth.api';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  onCancel: () => void;
}

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

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordForm({
  onSubmit,
  onCancel
}: ForgotPasswordFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
      otpCode: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(email);
      setOtpSent(true);
      // Pre-fill email in reset password form
      resetPasswordForm.setValue('email', email);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Có lỗi xảy ra. Vui lòng thử lại sau.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await resetPassword({
        email: data.email,
        otpCode: data.otpCode,
        newPassword: data.newPassword
      });

      if (response.success) {
        setResetSuccess(true);
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
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold">
          {resetSuccess
            ? 'Đặt lại mật khẩu thành công'
            : otpSent
              ? 'Đặt lại mật khẩu'
              : 'Quên mật khẩu'}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {resetSuccess
            ? 'Mật khẩu của bạn đã được đặt lại thành công. Đang chuyển đến trang đăng nhập...'
            : otpSent
              ? 'Nhập mã OTP và mật khẩu mới của bạn'
              : 'Nhập email của bạn để nhận mã OTP đặt lại mật khẩu'}
        </p>
      </div>

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
            Mã OTP đã được gửi đến email <strong>{email}</strong>. Vui lòng kiểm
            tra hộp thư và nhập mã OTP bên dưới.
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert for Password Reset */}
      {resetSuccess && (
        <div className="space-y-4">
          <Alert className="border-green-500 text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Mật khẩu của bạn đã được đặt lại thành công. Bạn sẽ được chuyển
              đến trang đăng nhập trong giây lát.
            </AlertDescription>
          </Alert>
          <Button
            variant="default"
            className="w-full"
            onClick={() => {
              onCancel();
              // Reset all states
              setResetSuccess(false);
              setOtpSent(false);
              setEmail('');
              resetPasswordForm.reset();
              setError(null);
            }}
          >
            Quay lại trang đăng nhập
          </Button>
        </div>
      )}

      {/* Email Input Form */}
      {!otpSent && !resetSuccess && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !email}
            >
              {isLoading ? 'Đang xử lý...' : 'Tiếp tục'}
            </Button>
          </div>
        </form>
      )}

      {/* Reset Password Form */}
      {otpSent && !resetSuccess && (
        <Form {...resetPasswordForm}>
          <form
            onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)}
            className="space-y-4"
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

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setOtpSent(false);
                  resetPasswordForm.reset();
                  setError(null);
                }}
                disabled={isLoading}
              >
                Quay lại
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
