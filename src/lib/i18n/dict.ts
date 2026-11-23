export type Lang = 'bn' | 'en';

const en = {
  nav: { home: 'Home', courses: 'Courses', dashboard: 'Dashboard', logout: 'Logout', login: 'Login/Signup', switchTo: 'বাংলা' },
  home: {
    badge: 'New courses every month',
    h1a: 'Learn the craft.',
    h1b: 'Ship the skill.',
    sub: 'Focused, high-quality courses from top instructors. Learn at your own pace, on any device.',
    browse: 'Browse Courses',
    start: 'Start for free',
    featured: 'Featured courses',
    viewAll: 'View all',
  },
  courses: {
    title: 'Course Catalog',
    sub: 'Find the right course and start learning today.',
    all: 'All',
    search: 'Search courses...',
    noneTitle: 'No courses found',
    noneSub: 'Try a different search term or category.',
  },
  categories: { development: 'Development', data: 'Data', design: 'Design' } as Record<string, string>,
  card: { free: 'Free', view: 'View course' },
  course: {
    modules: '{n} modules',
    lessons: '{n} lessons',
    enroll: 'Enroll Now',
    enrolled: 'Enrolled',
    lifetime: 'Full lifetime access',
    curriculum: 'Curriculum',
    freePreview: 'Free Preview',
    paidSoon: 'Online payment is coming soon',
  },
  lesson: {
    locked: 'This lesson is locked. Enroll in the course to unlock it.',
    back: 'Back to course',
    noVideo: 'No video for this lesson',
    prev: 'Previous',
    next: 'Next Lesson',
    total: '{n} lessons',
  },
  dash: { title: 'Dashboard', myCourses: 'My Courses', cont: 'Continue', emptyTitle: 'You have no enrollments yet', browse: 'Browse courses' },
  auth: {
    welcome: 'Welcome back',
    create: 'Create your account',
    loginSub: 'Log in to continue learning.',
    signupSub: 'Start learning in minutes.',
    email: 'Email',
    password: 'Password',
    login: 'Log in',
    signup: 'Sign up',
    needAccount: 'Need an account? Sign up',
    haveAccount: 'Have an account? Log in',
    checkEmail: 'Check your email to confirm your account.',
  },
};

export type Dict = typeof en;

const bn: Dict = {
  nav: { home: 'হোম', courses: 'কোর্স', dashboard: 'ড্যাশবোর্ড', logout: 'লগআউট', login: 'লগইন / সাইন আপ', switchTo: 'English' },
  home: {
    badge: 'প্রতি মাসে নতুন কোর্স',
    h1a: 'নিজেকে গড়ে তোলো,',
    h1b: 'দক্ষতায় এগিয়ে যাও।',
    sub: 'অভিজ্ঞ শিক্ষকদের সাজানো মানসম্মত কোর্স। নিজের গতিতে, যেকোনো ডিভাইসে শেখো।',
    browse: 'কোর্স দেখো',
    start: 'ফ্রিতে শুরু করো',
    featured: 'নির্বাচিত কোর্স',
    viewAll: 'সব দেখো',
  },
  courses: {
    title: 'কোর্স ক্যাটালগ',
    sub: 'তোমার জন্য সঠিক কোর্সটি খুঁজে নিয়ে আজই শেখা শুরু করো।',
    all: 'সব',
    search: 'কোর্স খোঁজো...',
    noneTitle: 'কোনো কোর্স পাওয়া যায়নি',
    noneSub: 'অন্য শব্দ বা ক্যাটাগরি দিয়ে চেষ্টা করো।',
  },
  categories: { development: 'ডেভেলপমেন্ট', data: 'ডেটা', design: 'ডিজাইন' },
  card: { free: 'ফ্রি', view: 'কোর্স দেখো' },
  course: {
    modules: '{n}টি মডিউল',
    lessons: '{n}টি লেসন',
    enroll: 'এনরোল করো',
    enrolled: 'এনরোল করা হয়েছে',
    lifetime: 'আজীবন অ্যাক্সেস',
    curriculum: 'কারিকুলাম',
    freePreview: 'ফ্রি প্রিভিউ',
    paidSoon: 'অনলাইন পেমেন্ট শীঘ্রই আসছে',
  },
  lesson: {
    locked: 'এই লেসনটি লক করা। আনলক করতে কোর্সে এনরোল করো।',
    back: 'কোর্সে ফিরে যাও',
    noVideo: 'এই লেসনে কোনো ভিডিও নেই',
    prev: 'আগের',
    next: 'পরের লেসন',
    total: '{n}টি লেসন',
  },
  dash: { title: 'ড্যাশবোর্ড', myCourses: 'আমার কোর্স', cont: 'চালিয়ে যাও', emptyTitle: 'তুমি এখনো কোনো কোর্সে এনরোল করোনি', browse: 'কোর্স দেখো' },
  auth: {
    welcome: 'স্বাগতম',
    create: 'অ্যাকাউন্ট খোলো',
    loginSub: 'শেখা চালিয়ে যেতে লগইন করো।',
    signupSub: 'কয়েক মিনিটেই শেখা শুরু করো।',
    email: 'ইমেইল',
    password: 'পাসওয়ার্ড',
    login: 'লগইন',
    signup: 'সাইন আপ',
    needAccount: 'অ্যাকাউন্ট নেই? সাইন আপ করো',
    haveAccount: 'অ্যাকাউন্ট আছে? লগইন করো',
    checkEmail: 'অ্যাকাউন্ট নিশ্চিত করতে ইমেইল চেক করো।',
  },
};

export const dict: Record<Lang, Dict> = { bn, en };

const loc = (lang: Lang) => (lang === 'bn' ? 'bn-BD' : 'en-US');
export const num = (n: number, lang: Lang) => Number(n).toLocaleString(loc(lang));
export const fmt = (s: string, n: number, lang: Lang) => s.replace('{n}', num(n, lang));
export const money = (n: number, lang: Lang) => `৳${num(n, lang)}`;
export const pick = (lang: Lang, en: string | null | undefined, bn: string | null | undefined) =>
  (lang === 'bn' && bn ? bn : en) ?? '';
