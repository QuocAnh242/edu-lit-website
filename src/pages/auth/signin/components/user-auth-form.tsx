import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';
import { loginUser } from '@/services/auth.api';
import { useToast } from '@/components/ui/use-toast';
const formSchema = z.object({
  username: z
    .string()
    .min(2, { message: 'Tên đăng nhập phải có ít nhất 2 ký tự' }),
  password: z.string().min(2, { message: 'Mật khẩu phải có ít nhất 2 ký tự' })
});

type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const defaultValues = {
    username: '',
    password: ''
  };

  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true);
    try {
      const response = await loginUser({
        username: data.username,
        password: data.password
      });

      if (response.success) {
        // Show success toast
        toast({
          title: 'Đăng nhập thành công!',
          description: `Chào mừng ${response.data.fullName}`,
          variant: 'default'
        });

        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        // Handle unsuccessful response
        form.setError('password', {
          type: 'manual',
          message: response.message || 'Đăng nhập thất bại'
        });

        toast({
          title: 'Đăng nhập thất bại',
          description:
            response.message || 'Vui lòng kiểm tra lại thông tin đăng nhập',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle error response
      let errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        // Handle validation errors from backend
        const errors = err.response.data.errors;
        errorMessage = Object.values(errors).flat().join(', ');
      } else if (err.message) {
        errorMessage = err.message;
      }

      form.setError('password', {
        type: 'manual',
        message: errorMessage
      });

      toast({
        title: 'Lỗi đăng nhập',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
        {/* Username Field */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên đăng nhập</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Nhập tên đăng nhập..."
                  disabled={loading}
                  {...field}
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
                <Input
                  type="password"
                  placeholder="Nhập mật khẩu của bạn..."
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={loading} className="ml-auto w-full" type="submit">
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
    </Form>
  );
}
