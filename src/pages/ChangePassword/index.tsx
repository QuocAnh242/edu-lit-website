import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';

import Navbar from '@/components/shared/navbar';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { changePassword } from '@/services/auth.api';

// Form validation schema
const changePasswordFormSchema = z.object({
  oldPassword: z.string().min(1, { message: 'Old password is required' }),
  newPassword: z
    .string()
    .min(6, { message: 'New password must be at least 6 characters' })
    .max(100, { message: 'New password must not exceed 100 characters' })
});

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export default function ChangePassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: ''
    }
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setLoading(true);
    try {
      const response = await changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword
      });

      if (response.success) {
        toast({
          title: 'Success!',
          description: 'Your password has been changed successfully',
          variant: 'default'
        });

        // Reset form
        form.reset();
        // Navigate back to profile after a short delay
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } else {
        toast({
          title: 'Change Password Failed',
          description: response.message || 'Unable to change password',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Change password error:', error);

      const err = error as {
        response?: {
          data?: {
            message?: string;
            errors?: Record<string, string[]>;
          };
        };
      };
      let errorMessage = 'Unable to change password';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.errors) {
        const errors = err.response.data.errors;
        errorMessage = Object.values(errors).flat().join(', ');
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50">
      <Navbar />
      <div className="container mx-auto max-w-2xl p-6">
        <div className="mb-8">
          <h1
            className="mb-2 text-4xl font-bold tracking-tight text-cyan-600"
            style={{ fontFamily: 'LatoBlack, sans-serif' }}
          >
            Change Password
          </h1>
          <p
            className="text-lg text-gray-600"
            style={{ fontFamily: 'LatoBlack, sans-serif' }}
          >
            Update your account password
          </p>
        </div>

        <Card className="border-cyan-200 shadow-lg">
          <CardHeader className="border-b border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50">
            <CardTitle
              className="text-cyan-700"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Change Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your current password and choose a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Old Password Field */}
                <FormField
                  control={form.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-gray-700"
                        style={{ fontFamily: 'LatoBlack, sans-serif' }}
                      >
                        Current Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showOldPassword ? 'text' : 'password'}
                            placeholder="Enter your current password..."
                            disabled={loading}
                            className="border-cyan-200 pr-10 focus:border-cyan-500 focus:ring-cyan-500"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-600"
                          >
                            {showOldPassword ? (
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

                {/* New Password Field */}
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-gray-700"
                        style={{ fontFamily: 'LatoBlack, sans-serif' }}
                      >
                        New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Enter your new password..."
                            disabled={loading}
                            className="border-cyan-200 pr-10 focus:border-cyan-500 focus:ring-cyan-500"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-600"
                          >
                            {showNewPassword ? (
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

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg transition-all duration-200 hover:from-cyan-700 hover:to-blue-700"
                    style={{ fontFamily: 'LatoBlack, sans-serif' }}
                  >
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Lock className="mr-2 h-4 w-4" />
                    {loading ? 'Changing Password...' : 'Change Password'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/profile')}
                    disabled={loading}
                    className="border-cyan-300 text-cyan-700 hover:border-cyan-400 hover:bg-cyan-50"
                    style={{ fontFamily: 'LatoBlack, sans-serif' }}
                  >
                    Cancel
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
