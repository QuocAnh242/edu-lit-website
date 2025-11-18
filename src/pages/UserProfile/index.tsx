import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Mail, Calendar } from 'lucide-react';

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
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { getProfile, updateProfile } from '@/services/auth.api';
import { User } from '@/types/user.type';
import helpers from '@/helpers';

// Form validation schema - only fullName can be updated
const profileFormSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters' })
    .max(100, { message: 'Full name must not exceed 100 characters' })
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
      fullName: ''
    }
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getProfile();

        if (response.success && response.data) {
          setUserData(response.data);
          // Set form values - only fullName
          form.reset({
            fullName: response.data.fullName
          });
        } else {
          toast({
            title: 'Error',
            description: response.message || 'Unable to load user information',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        const err = error as {
          response?: {
            data?: { message?: string };
            status?: number;
          };
        };
        const errorMessage =
          err?.response?.data?.message || 'Unable to load user information';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
        // If unauthorized, redirect to login
        if (err?.response?.status === 401) {
          navigate('/signin');
        }
      } finally {
        setFetchingUser(false);
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, toast]);

  const onSubmit = async (data: ProfileFormValues) => {
    setLoading(true);
    try {
      const response = await updateProfile({
        fullName: data.fullName
      });

      if (response.success && response.data) {
        toast({
          title: 'Success!',
          description: 'Your profile has been updated',
          variant: 'default'
        });

        // Update user data with response
        setUserData(response.data);
      } else {
        toast({
          title: 'Update Failed',
          description: response.message || 'Unable to update profile',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Update error:', error);

      const err = error as {
        response?: {
          data?: {
            message?: string;
            errors?: Record<string, string[]>;
          };
        };
      };
      let errorMessage = 'Unable to update profile';
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50">
      <Navbar />
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-8">
          <h1
            className="mb-2 text-4xl font-bold tracking-tight text-cyan-600"
            style={{ fontFamily: 'LatoBlack, sans-serif' }}
          >
            Profile
          </h1>
          <p
            className="text-lg text-gray-600"
            style={{ fontFamily: 'LatoBlack, sans-serif' }}
          >
            Manage your account information
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* User Info Card */}
          <Card className="border-cyan-200 shadow-lg md:col-span-1">
            <CardHeader className="border-b border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50">
              <CardTitle
                className="text-cyan-700"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24 ring-4 ring-cyan-200">
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl font-bold text-white">
                    {userData?.fullName ? getInitials(userData.fullName) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3
                    className="text-lg font-semibold text-gray-800"
                    style={{ fontFamily: 'LatoBlack, sans-serif' }}
                  >
                    {userData?.fullName}
                  </h3>
                  <p className="text-sm font-medium text-cyan-600">
                    @{userData?.username}
                  </p>
                </div>
              </div>

              <Separator className="bg-cyan-200" />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-cyan-600" />
                  <span className="break-all text-gray-700">
                    {userData?.email}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-cyan-600" />
                  <span className="text-gray-700">
                    Joined:{' '}
                    {userData?.createdAt
                      ? helpers.convertToDateDDMMYYYY(userData.createdAt)
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Card */}
          <Card className="border-cyan-200 shadow-lg md:col-span-2">
            <CardHeader className="border-b border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50">
              <CardTitle
                className="text-cyan-700"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                Edit Profile
              </CardTitle>
              <CardDescription className="text-gray-600">
                Update your personal information here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Username Field - Read Only */}
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium leading-none text-gray-700"
                      style={{ fontFamily: 'LatoBlack, sans-serif' }}
                    >
                      Username
                    </label>
                    <Input
                      value={userData?.username || ''}
                      disabled={true}
                      className="border-cyan-200 bg-cyan-50 text-gray-700"
                    />
                  </div>

                  {/* Email Field - Read Only */}
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium leading-none text-gray-700"
                      style={{ fontFamily: 'LatoBlack, sans-serif' }}
                    >
                      Email
                    </label>
                    <Input
                      value={userData?.email || ''}
                      disabled={true}
                      className="border-cyan-200 bg-cyan-50 text-gray-700"
                    />
                  </div>

                  {/* Full Name Field - Editable */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className="text-gray-700"
                          style={{ fontFamily: 'LatoBlack, sans-serif' }}
                        >
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name..."
                            disabled={loading}
                            className="border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                            {...field}
                          />
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
                      {loading ? 'Updating...' : 'Update Profile'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
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
    </div>
  );
}
