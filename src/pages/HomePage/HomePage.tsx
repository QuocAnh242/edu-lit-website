import { useState, useRef, useEffect } from 'react';
import './HomePage.module.css';
import {
  Users,
  BookOpen,
  Key,
  Mail,
  Plus,
  Search,
  Filter,
  User,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface Course {
  id: number;
  title: string;
  instructor: string;
  description: string;
  category: string;
  students: number;
  duration: string;
  level: string;
  image: string;
  enrollmentPassword: string;
}

interface Invitation {
  id: number;
  email: string;
  course: Course;
  status: string;
  date: string;
}

type Category = 'all' | 'Frontend' | 'Backend' | 'Design' | 'Mobile';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState<
    'courses' | 'enrolled' | 'invitations'
  >('courses');
  const [enrollmentPassword, setEnrollmentPassword] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [coursePassword, setCoursePassword] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // User data
  const user = {
    email: 'tranthinh5801@gmail.com',
    name: 'Tran Thinh',
    role: 'student',
    password: '123'
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mock data
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      title: 'React Fundamentals',
      instructor: 'Nguyễn Văn A',
      description: 'Học React từ cơ bản đến nâng cao',
      category: 'Frontend',
      students: 125,
      duration: '8 tuần',
      level: 'Beginner',
      image: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=React',
      enrollmentPassword: 'react123'
    },
    {
      id: 2,
      title: 'Node.js Backend Development',
      instructor: 'Trần Thị B',
      description: 'Xây dựng API và backend với Node.js',
      category: 'Backend',
      students: 89,
      duration: '10 tuần',
      level: 'Intermediate',
      image: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Node.js',
      enrollmentPassword: 'node456'
    },
    {
      id: 3,
      title: 'UI/UX Design Principles',
      instructor: 'Lê Văn C',
      description: 'Thiết kế giao diện người dùng chuyên nghiệp',
      category: 'Design',
      students: 156,
      duration: '6 tuần',
      level: 'Beginner',
      image: 'https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=UI/UX',
      enrollmentPassword: 'design789'
    }
  ]);

  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const categories: Category[] = [
    'all',
    'Frontend',
    'Backend',
    'Design',
    'Mobile'
  ];

  const handleEnrollWithPassword = (): void => {
    if (!enrollmentPassword.trim()) return;

    const course = courses.find(
      (c) => c.enrollmentPassword === enrollmentPassword
    );
    if (course) {
      if (!enrolledCourses.some((ec) => ec.id === course.id)) {
        setEnrolledCourses([...enrolledCourses, course]);
        alert(`Đã đăng ký thành công khóa học: ${course.title}`);
        setEnrollmentPassword('');
      } else {
        alert('Bạn đã đăng ký khóa học này rồi!');
      }
    } else {
      alert('Mật khẩu khóa học không đúng!');
    }
  };

  const handleDirectEnroll = (course: Course): void => {
    setSelectedCourse(course);
    setShowPasswordModal(true);
    setCoursePassword('');
  };

  const handlePasswordSubmit = (): void => {
    if (!coursePassword.trim()) {
      alert('Vui lòng nhập mật khẩu!');
      return;
    }

    if (
      selectedCourse &&
      coursePassword === selectedCourse.enrollmentPassword
    ) {
      if (!enrolledCourses.some((ec) => ec.id === selectedCourse.id)) {
        setEnrolledCourses([...enrolledCourses, selectedCourse]);
        alert(`Đã đăng ký thành công khóa học: ${selectedCourse.title}`);
        setShowPasswordModal(false);
        setCoursePassword('');
        setSelectedCourse(null);
      } else {
        alert('Bạn đã đăng ký khóa học này rồi!');
        setShowPasswordModal(false);
      }
    } else {
      alert('Mật khẩu không đúng!');
    }
  };

  const handleCloseModal = (): void => {
    setShowPasswordModal(false);
    setCoursePassword('');
    setSelectedCourse(null);
  };

  const handleSendInvitation = (courseId: number): void => {
    if (!inviteEmail.trim()) return;

    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const newInvitation: Invitation = {
      id: Date.now(),
      email: inviteEmail,
      course: course,
      status: 'sent',
      date: new Date().toLocaleDateString('vi-VN')
    };

    setInvitations([...invitations, newInvitation]);
    alert(`Đã gửi lời mời đến ${inviteEmail} cho khóa học ${course.title}`);
    setInviteEmail('');
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b-4 border-blue-500 bg-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">LMS FPT</h1>
            </div>

            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('courses')}
                className={`rounded-lg px-4 py-2 font-medium transition-all ${
                  activeTab === 'courses'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                Khóa học
              </button>
              <button
                onClick={() => setActiveTab('enrolled')}
                className={`rounded-lg px-4 py-2 font-medium transition-all ${
                  activeTab === 'enrolled'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                Đã đăng ký ({enrolledCourses.length})
              </button>
              <button
                onClick={() => setActiveTab('invitations')}
                className={`rounded-lg px-4 py-2 font-medium transition-all ${
                  activeTab === 'invitations'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                Lời mời ({invitations.length})
              </button>

              {/* User Dropdown Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 rounded-lg px-4 py-2 transition-colors hover:bg-gray-100"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-700">{user.name}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-xl">
                    <div className="border-b border-gray-200 px-4 py-3">
                      <p className="text-xs text-gray-500">{user.role}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Navigate to profile
                      }}
                      className="flex w-full items-center space-x-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                    >
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="text-gray-700">Thông tin</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Navigate to settings
                      }}
                      className="flex w-full items-center space-x-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                    >
                      <Settings className="h-5 w-5 text-gray-600" />
                      <span className="text-gray-700">Cài đặt</span>
                    </button>

                    <div className="mt-2 border-t border-gray-200 pt-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          // Handle logout
                        }}
                        className="flex w-full items-center space-x-3 px-4 py-3 text-left transition-colors hover:bg-red-50"
                      >
                        <LogOut className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-600">
                          Đăng xuất
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Main Content */}
        {activeTab === 'courses' && (
          <>
            {/* Search and Filter */}
            <div className="mb-6 rounded-xl bg-white p-6 shadow-lg">
              <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm khóa học..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) =>
                      setSelectedCategory(e.target.value as Category)
                    }
                    className="appearance-none rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-8 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'Tất cả danh mục' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl border-t-4 border-blue-500 bg-white shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <img
                    src={course.image}
                    alt={course.title}
                    className="h-48 w-full rounded-t-lg object-cover"
                  />
                  <div className="p-6">
                    <div className="mb-3 flex items-start justify-between">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                        {course.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {course.level}
                      </span>
                    </div>

                    <h3 className="mb-2 text-xl font-bold text-gray-900">
                      {course.title}
                    </h3>
                    <p className="mb-3 line-clamp-2 text-gray-600">
                      {course.description}
                    </p>

                    <div className="mb-4 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{course.students} học viên</span>
                      </div>
                      <span>•</span>
                      <span>{course.duration}</span>
                    </div>

                    <p className="mb-4 text-sm text-gray-600">
                      Giảng viên: {course.instructor}
                    </p>

                    <div className="space-y-3">
                      <button
                        onClick={() => handleDirectEnroll(course)}
                        disabled={enrolledCourses.some(
                          (ec) => ec.id === course.id
                        )}
                        className={`w-full rounded-lg py-3 font-medium transition-all ${
                          enrolledCourses.some((ec) => ec.id === course.id)
                            ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                            : 'bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg'
                        }`}
                      >
                        {enrolledCourses.some((ec) => ec.id === course.id)
                          ? 'Đã đăng ký'
                          : 'Đăng ký ngay'}
                      </button>

                      <div className="flex space-x-2">
                        <input
                          type="email"
                          placeholder="Email để mời..."
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleSendInvitation(course.id)}
                          className="rounded-lg bg-green-500 px-4 py-2 text-sm text-white shadow-md transition-colors hover:bg-green-600 hover:shadow-lg"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="rounded bg-gray-50 p-2 text-xs text-gray-500">
                        Mật khẩu đăng ký:{' '}
                        <span className="font-mono font-bold">••••••</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'enrolled' && (
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Khóa học đã đăng ký
            </h2>
            {enrolledCourses.length === 0 ? (
              <div className="py-12 text-center">
                <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <p className="text-lg text-gray-500">
                  Bạn chưa đăng ký khóa học nào
                </p>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="mt-4 rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
                >
                  Khám phá khóa học
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {enrolledCourses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-lg border border-gray-200 p-6 transition-shadow hover:shadow-lg"
                  >
                    <h3 className="mb-2 text-lg font-bold text-gray-900">
                      {course.title}
                    </h3>
                    <p className="mb-2 text-gray-600">
                      Giảng viên: {course.instructor}
                    </p>
                    <p className="mb-4 text-sm text-gray-500">
                      {course.duration}
                    </p>
                    <button className="w-full rounded-lg bg-green-500 py-2 text-white transition-colors hover:bg-green-600">
                      Vào học
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Lời mời đã gửi
            </h2>
            {invitations.length === 0 ? (
              <div className="py-12 text-center">
                <Mail className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <p className="text-lg text-gray-500">
                  Chưa có lời mời nào được gửi
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {invitation.course.title}
                      </h3>
                      <p className="text-gray-600">
                        Đã mời: {invitation.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        Ngày gửi: {invitation.date}
                      </p>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
                      {invitation.status === 'sent'
                        ? 'Đã gửi'
                        : invitation.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Nhập mật khẩu khóa học
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {selectedCourse && (
              <div className="mb-4">
                <h4 className="mb-2 font-semibold text-gray-800">
                  {selectedCourse.title}
                </h4>
                <p className="text-sm text-gray-600">
                  Giảng viên: {selectedCourse.instructor}
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Mật khẩu khóa học
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu để đăng ký"
                value={coursePassword}
                onChange={(e) => setCoursePassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
              >
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
