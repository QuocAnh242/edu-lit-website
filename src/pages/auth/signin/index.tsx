'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import UserAuthForm from './components/user-auth-form';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import Bg from '@/assets/bg.jpg';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import ForgotPasswordForm from './components/forgot-password-form';
import { forgetPassword, googleLogin } from '@/services/auth.api';
import { useToast } from '@/components/ui/use-toast';

// Declare Google types for TypeScript
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: () => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              width?: string;
            }
          ) => void;
        };
      };
    };
  }
}

export default function SignInPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();
  const googleScriptLoaded = useRef(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Handle Google credential response
  const handleGoogleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setIsGoogleLoading(true);
      try {
        const loginResponse = await googleLogin({
          idToken: response.credential
        });

        if (loginResponse.success) {
          toast({
            title: 'Đăng nhập thành công!',
            description: `Chào mừng ${loginResponse.data.fullName}`,
            variant: 'default'
          });

          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else {
          toast({
            title: 'Đăng nhập thất bại',
            description:
              loginResponse.message || 'Không thể đăng nhập bằng Google',
            variant: 'destructive'
          });
        }
      } catch (err: unknown) {
        console.error('Google login error:', err);

        let errorMessage = 'Không thể đăng nhập bằng Google. Vui lòng thử lại.';

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

        toast({
          title: 'Lỗi đăng nhập Google',
          description: errorMessage,
          variant: 'destructive'
        });
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [toast]
  );

  // Initialize Google Sign In
  const initializeGoogleSignIn = useCallback(() => {
    if (!window.google || !googleButtonRef.current) return;

    // Get Google Client ID from environment variable or use a default
    // You should set VITE_GOOGLE_CLIENT_ID in your .env file
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';

    if (clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      console.warn(
        'Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file'
      );
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredentialResponse
    });

    // Render Google button in the hidden div
    if (googleButtonRef.current) {
      try {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '100%'
        });
      } catch (error) {
        console.error('Error rendering Google button:', error);
      }
    }
  }, [handleGoogleCredentialResponse]);

  // Load Google Identity Services script
  useEffect(() => {
    if (googleScriptLoaded.current) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait a bit for Google to be fully ready
      setTimeout(() => {
        googleScriptLoaded.current = true;
        initializeGoogleSignIn();
      }, 100);
    };
    script.onerror = () => {
      console.error('Failed to load Google Identity Services script');
      toast({
        title: 'Lỗi',
        description: 'Không thể tải Google Sign In. Vui lòng thử lại sau.',
        variant: 'destructive'
      });
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [initializeGoogleSignIn, toast]);

  const handleForgotPassword = async (email: string) => {
    try {
      const response = await forgetPassword({ email });

      if (response.success) {
        toast({
          title: 'Yêu cầu thành công!',
          description:
            response.message ||
            'Nếu email tồn tại, mã OTP đã được gửi đến email của bạn.',
          variant: 'default'
        });
      } else {
        throw new Error(
          response.message || 'Yêu cầu thất bại. Vui lòng thử lại.'
        );
      }
    } catch (err: unknown) {
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

      toast({
        title: 'Lỗi yêu cầu',
        description: errorMessage,
        variant: 'destructive'
      });

      throw err;
    }
  };

  return (
    <div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        to="/"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute right-4 top-4 hidden md:right-8 md:top-8'
        )}
      >
        Login
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
          LiveStock
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg text-current">
              Hệ thống quản trị - LiveStock
            </p>
          </blockquote>
        </div>
      </div>

      {/* Right column with login form */}
      <div className="flex h-full items-center justify-center p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          {!showForgotPassword && (
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Đăng nhập
              </h1>
              <p className="text-sm text-muted-foreground">
                Nhập tài khoản của bạn để tiếp tục
              </p>
            </div>
          )}

          {showForgotPassword ? (
            <ForgotPasswordForm
              onSubmit={handleForgotPassword}
              onCancel={() => setShowForgotPassword(false)}
            />
          ) : (
            <>
              {/* Main login form */}
              <UserAuthForm />

              {/* Forgot password link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
                >
                  Quên mật khẩu?
                </button>
              </div>

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

              {/* Social login */}
              {isGoogleLoading ? (
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  disabled
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </Button>
              ) : (
                <div ref={googleButtonRef} className="w-full" />
              )}

              {/* Sign up link */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Chưa có tài khoản?{' '}
                  <Link
                    to="/signup"
                    className="text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </>
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
