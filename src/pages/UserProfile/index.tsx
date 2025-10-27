import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Mail, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { getUserById, updateUser } from '@/services/user.api';
import { User } from '@/types/user.type';
import helpers from '@/helpers';

// Form validation schema
const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: 'Tên đăng nhập phải có ít nhất 2 ký tự' })
    .max(50, { message: 'Tên đăng nhập không được vượt quá 50 ký tự' }),
  email: z.string().email({ message: 'Email không hợp lệ' }),
  fullName: z
    .string()
    .min(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' })
    .max(100, { message: 'Họ và tên không được vượt quá 100 ký tự' })
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function UserProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      email: '',
      fullName: ''
    }
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Try to get user ID from localStorage first (more reliable)
        let userId = '';
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            userId = user.id;
          } catch (e) {
            console.error('Error parsing user from localStorage:', e);
          }
        }

        // Fallback to JWT token if localStorage doesn't have user
        if (!userId) {
          userId = helpers.getUserId();
        }

        // If still no userId, redirect to login
        if (!userId) {
          toast({
            title: 'Lỗi xác thực',
            description: 'Vui lòng đăng nhập lại',
            variant: 'destructive'
          });
          navigate('/signin');
          return;
        }

        const response = await getUserById(userId);

        if (response.success && response.data) {
          setUserData(response.data);
          // Set form values
          form.reset({
            username: response.data.username,
            email: response.data.email,
            fullName: response.data.fullName
          });
        } else {
          toast({
            title: 'Lỗi',
            description:
              response.message || 'Không thể tải thông tin người dùng',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải thông tin người dùng',
          variant: 'destructive'
        });
      } finally {
        setFetchingUser(false);
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, toast]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!userData) return;

    setLoading(true);
    try {
      const updateData = {
        id: userData.id,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        roleId: userData.roleId,
        roleName: userData.roleName,
        token: userData.token,
        createdAt: userData.createdAt
      };

      const response = await updateUser(userData.id, updateData);

      if (response.success) {
        toast({
          title: 'Cập nhật thành công!',
          description: 'Thông tin của bạn đã được cập nhật',
          variant: 'default'
        });

        // Refresh user data
        const updatedUser = await getUserById(userData.id);
        if (updatedUser.success && updatedUser.data) {
          setUserData(updatedUser.data);
        }
      } else {
        toast({
          title: 'Cập nhật thất bại',
          description: response.message || 'Không thể cập nhật thông tin',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Update error:', error);

      let errorMessage = 'Không thể cập nhật thông tin';
      const err = error as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        errorMessage = Object.values(errors).flat().join(', ');
      }

      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">
          Quản lý thông tin tài khoản của bạn
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                  {userData?.fullName ? getInitials(userData.fullName) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold">{userData?.fullName}</h3>
                <p className="text-sm text-muted-foreground">
                  @{userData?.username}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="break-all">{userData?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Tham gia:{' '}
                  {userData?.createdAt
                    ? helpers.convertToDateDDMMYYYY(userData.createdAt)
                    : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Chỉnh sửa hồ sơ</CardTitle>
            <CardDescription>
              Cập nhật thông tin cá nhân của bạn tại đây
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
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
                          placeholder="Nhập tên đăng nhập..."
                          disabled={true}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Tên đăng nhập dùng để đăng nhập vào hệ thống
                      </FormDescription>
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
                          type="email"
                          placeholder="Nhập email..."
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Địa chỉ email của bạn để liên hệ
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Full Name Field */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và tên</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập họ và tên..."
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Tên đầy đủ của bạn để hiển thị
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {loading ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
