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
import { Separator } from '@/components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { registerUser } from '@/services/auth.api';
import { useToast } from '@/components/ui/use-toast';

// Form validation schema
const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' })
      .max(20, { message: 'Tên đăng nhập không được quá 20 ký tự' })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'
      }),
    fullname: z
      .string()
      .min(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
      .max(50, { message: 'Họ tên không được quá 50 ký tự' }),
    email: z
      .string()
      .min(1, { message: 'Email là bắt buộc' })
      .email({ message: 'Email không hợp lệ' }),
    password: z
      .string()
      .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
    repeatPassword: z.string()
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['repeatPassword']
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignUpPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      fullname: '',
      email: '',
      password: '',
      repeatPassword: ''
    }
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call register API
      const response = await registerUser({
        username: data.username,
        fullName: data.fullname,
        email: data.email,
        password: data.password
      });

      if (response.success) {
        // Store token if needed
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem(
            'user',
            JSON.stringify({
              id: response.data.id,
              username: response.data.username,
              email: response.data.email,
              fullName: response.data.fullName,
              roleName: response.data.roleName
            })
          );
        }

        // Show success toast
        toast({
          title: 'Đăng ký thành công!',
          description: response.message || 'Chào mừng bạn đến với EduLit.',
          variant: 'default'
        });

        // Redirect to signin page or dashboard after a short delay
        setTimeout(() => {
          navigate('/signin');
        }, 1500);
      } else {
        setError(response.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        toast({
          title: 'Đăng ký thất bại',
          description: response.message || 'Vui lòng thử lại.',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error('Register error:', err);

      // Handle error response
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Show error toast
      toast({
        title: 'Lỗi đăng ký',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // Google OAuth implementation
    console.log('Google signup clicked');
    const a = document.createElement('a');
    const url =
      process.env.NODE_ENV === 'production'
        ? 'https://api.hoptacxaluavang.site'
        : 'https://api.hoptacxaluavang.site';
    a.href = `${url}/api/auth/google-login`;
    a.target = '_self';
    a.click();
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

      {/* Right column with signup form */}
      <div className="flex h-full items-center justify-center p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Đăng ký tài khoản
            </h1>
            <p className="text-sm text-muted-foreground">
              Tạo tài khoản mới để bắt đầu học tập
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Signup Form */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full space-y-4"
            >
              {/* Username Field */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên đăng nhập</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Nhập tên đăng nhập..."
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Full Name Field */}
              <FormField
                control={form.control}
                name="fullname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Nhập họ và tên..."
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
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

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Nhập mật khẩu..."
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

              {/* Repeat Password Field */}
              <FormField
                control={form.control}
                name="repeatPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xác nhận mật khẩu</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showRepeatPassword ? 'text' : 'password'}
                          placeholder="Nhập lại mật khẩu..."
                          disabled={isLoading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowRepeatPassword(!showRepeatPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                        >
                          {showRepeatPassword ? (
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
                {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
              </Button>
            </form>
          </Form>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Hoặc tiếp tục với
              </span>
            </div>
          </div>

          {/* Social signup */}
          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Google
          </Button>

          {/* Sign in link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link
                to="/signin"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>

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
