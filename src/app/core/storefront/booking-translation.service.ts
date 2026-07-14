import { Injectable, signal, computed } from '@angular/core';

export type BookingLocale = 'en' | 'ar';

const STORAGE_KEY = 'launchly_booking_lang';

/**
 * BookingTranslationService — scoped to the Booking store type only (per
 * explicit request: bilingual support starts here, not platform-wide yet).
 * Runtime-switchable, no separate builds per locale (Angular's built-in
 * i18n needs a build per locale, which doesn't fit a single running SPA
 * where the visitor picks a language on the fly).
 */
@Injectable({ providedIn: 'root' })
export class BookingTranslationService {
  readonly locale = signal<BookingLocale>(this.#loadInitial());
  readonly dir    = computed<'ltr' | 'rtl'>(() => this.locale() === 'ar' ? 'rtl' : 'ltr');
  readonly isRtl  = computed(() => this.locale() === 'ar');

  setLocale(locale: BookingLocale): void {
    this.locale.set(locale);
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.setAttribute('dir', this.dir());
    document.documentElement.setAttribute('lang', locale);
  }

  toggle(): void {
    this.setLocale(this.locale() === 'en' ? 'ar' : 'en');
  }

  /** Flat dictionary lookup — keys are literal dotted strings like
   *  'nav.home', not nested objects. (An earlier version treated the key
   *  as a nested path and always missed, so every label rendered as its
   *  raw key, e.g. "nav.home" instead of "Home".) */
  t(key: string): string {
    return TRANSLATIONS[this.locale()][key] ?? key;
  }

  #loadInitial(): BookingLocale {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const locale: BookingLocale = saved === 'ar' ? 'ar' : 'en';
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', locale);
    }
    return locale;
  }
}

// ─── Dictionaries ───────────────────────────────────────────────────────────

const TRANSLATIONS: Record<BookingLocale, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.bookNow': 'Book now',
    'nav.myBookings': 'My bookings',

    'hero.kicker': 'Reserve your spot',
    'hero.cta.book': 'Book an appointment',
    'hero.cta.services': 'View services',
    'hero.trust.rated': 'Highly rated',
    'hero.trust.confirmed': 'Instantly confirmed',
    'hero.trust.flexible': 'Free rescheduling',
    'hero.search.placeholder': 'Search a service…',
    'hero.search.button': 'Search',
    'hero.popular': 'Popular',
    'hero.badge.confirmed.title': 'Booking confirmed!',
    'hero.badge.confirmed.time': 'Tomorrow, 10:30 AM',
    'hero.badge.status': 'Status',
    'hero.badge.verified': 'Verified ✓',

    'trust.secure': 'Secure booking',
    'trust.instant': 'Instant confirmation',
    'trust.reschedule': 'Free rescheduling',
    'trust.verified': 'Verified business',

    'how.kicker': 'How it works',
    'how.title': 'Book in three steps',
    'how.step1.title': 'Choose a service',
    'how.step1.desc': 'Browse what we offer and pick what you need.',
    'how.step2.title': 'Pick a time',
    'how.step2.desc': 'See real availability and choose what suits you.',
    'how.step3.title': 'Get confirmed',
    'how.step3.desc': 'Receive instant confirmation — no waiting.',

    'faq.kicker': 'Questions',
    'faq.title': 'Frequently asked',
    'faq.q1': 'How do I book an appointment?',
    'faq.a1': 'Choose a service, pick an available time slot, and confirm your details — you\'ll get instant confirmation.',
    'faq.q2': 'Can I reschedule or cancel?',
    'faq.a2': 'Yes, reach out to us and we\'ll help you find a new time that works.',
    'faq.q3': 'Do I need an account?',
    'faq.a3': 'You\'ll create a quick account as part of booking, so you can track your appointments.',

    'cta.title': 'Ready to book?',
    'cta.subtitle': 'Find a time that works for you in under a minute.',
    'cta.button': 'Book now',

    'services.kicker': 'What we offer',
    'services.title': 'Our services',
    'services.empty': 'No services available yet. Check back soon.',
    'services.duration': 'min',
    'services.bookBtn': 'Book',
    'services.viewAll': 'View all services',

    'list.title': 'Services',
    'list.count.one': 'service available',
    'list.count.many': 'services available',
    'list.search.placeholder': 'Search services…',
    'list.sort.label': 'Sort',
    'list.sort.relevance': 'Recommended',
    'list.sort.priceAsc': 'Price: low to high',
    'list.sort.priceDesc': 'Price: high to low',
    'list.sort.duration': 'Duration',
    'list.sort.name': 'Name (A–Z)',
    'list.recent': 'Recent searches',
    'list.recent.clear': 'Clear',
    'list.results.for': 'results for',
    'list.noResults.title': 'No results',
    'list.noResults.desc': 'No services match',
    'list.noResults.clear': 'Clear search',
    'list.empty.title': 'No services yet',
    'list.empty.desc': 'Check back soon.',
    'list.bookNow': 'Book now',
    'list.price': 'Price',

    'about.kicker': 'About',

    'cal.back': 'Back to services',
    'cal.step': 'Select date & time',
    'cal.pickDate.title': 'Pick a date',
    'cal.pickDate.desc': 'Choose a date on the calendar to see available times.',
    'cal.slotsError.title': 'Could not load slots',
    'cal.slotsError.desc': 'Something went wrong. Please try again.',
    'cal.retry': 'Retry',
    'cal.noAvail.title': 'No availability',
    'cal.noAvail.desc': 'No open slots on',
    'cal.noAvail.tryOther': 'Try a different date.',
    'cal.slotCount.one': 'slot',
    'cal.slotCount.many': 'slots',
    'cal.selectedTime': 'Selected time',
    'cal.change': 'Change',
    'cal.continue': 'Continue to confirm',
    'cal.serviceError': 'Could not load service details.',
    'cal.at': 'at',

    'confirm.changeDateTime': 'Change date or time',
    'confirm.summary': 'Booking summary',
    'confirm.serviceError': 'Could not load service details.',
    'confirm.signIn': 'Sign in to continue',
    'confirm.createAccount': 'Create account',
    'confirm.logIn': 'Log in',
    'confirm.firstName': 'First name',
    'confirm.lastName': 'Last name',
    'confirm.email': 'Email',
    'confirm.password': 'Password',
    'confirm.required': 'Required',
    'confirm.validEmail': 'Valid email required',
    'confirm.min8': 'Min 8 characters',
    'confirm.createBtn': 'Create account & continue',
    'confirm.creating': 'Creating account…',
    'confirm.alreadyHave': 'Already have an account?',
    'confirm.logInBtn': 'Log in & continue',
    'confirm.loggingIn': 'Logging in…',
    'confirm.noAccount': "Don't have an account?",
    'confirm.createOne': 'Create one',
    'confirm.confirmTitle': 'Confirm your booking',
    'confirm.notes': 'Notes',
    'confirm.optional': '(optional)',
    'confirm.notesPlaceholder': "Anything you'd like us to know…",
    'confirm.confirmBtn': 'Confirm booking',
    'confirm.confirming': 'Confirming…',
    'confirm.bookingAs': 'Booking as',
    'confirm.success.title': "You're booked!",
    'confirm.success.desc': 'Your appointment has been confirmed.',
    'confirm.bookAnother': 'Book another service',
    'confirm.backHome': 'Back to home',

    'footer.visit': 'Visit',
    'footer.explore': 'Explore',
    'footer.rights': 'All rights reserved.',

    'lang.switch': 'العربية',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.services': 'الخدمات',
    'nav.about': 'من نحن',
    'nav.contact': 'تواصل معنا',
    'nav.bookNow': 'احجز الآن',
    'nav.myBookings': 'حجوزاتي',

    'hero.kicker': 'احجز مكانك',
    'hero.cta.book': 'احجز موعد',
    'hero.cta.services': 'عرض الخدمات',
    'hero.trust.rated': 'تقييم عالي',
    'hero.trust.confirmed': 'تأكيد فوري',
    'hero.trust.flexible': 'تغيير الموعد مجاناً',
    'hero.search.placeholder': 'دور على خدمة…',
    'hero.search.button': 'بحث',
    'hero.popular': 'الأكثر طلباً',
    'hero.badge.confirmed.title': 'تم تأكيد الحجز!',
    'hero.badge.confirmed.time': 'بكرة، 10:30 صباحاً',
    'hero.badge.status': 'الحالة',
    'hero.badge.verified': 'موثّق ✓',

    'trust.secure': 'حجز آمن',
    'trust.instant': 'تأكيد فوري',
    'trust.reschedule': 'تغيير الموعد مجاناً',
    'trust.verified': 'نشاط تجاري موثّق',

    'how.kicker': 'إزاي يعمل',
    'how.title': 'احجز في 3 خطوات',
    'how.step1.title': 'اختار الخدمة',
    'how.step1.desc': 'شوف اللي بنقدمه واختار اللي محتاجه.',
    'how.step2.title': 'اختار الميعاد',
    'how.step2.desc': 'شوف المواعيد المتاحة فعلياً واختار اللي يناسبك.',
    'how.step3.title': 'استلم التأكيد',
    'how.step3.desc': 'هيوصلك تأكيد فوري - من غير ما تستنى.',

    'faq.kicker': 'أسئلة',
    'faq.title': 'أسئلة شائعة',
    'faq.q1': 'أحجز إزاي؟',
    'faq.a1': 'اختار الخدمة، اختار ميعاد متاح، وأكّد بياناتك - هيجيلك تأكيد فوري.',
    'faq.q2': 'أقدر أغيّر أو ألغي الميعاد؟',
    'faq.a2': 'أيوه، تواصل معانا وهنساعدك تلاقي ميعاد تاني يناسبك.',
    'faq.q3': 'محتاج حساب عشان أحجز؟',
    'faq.a3': 'هتعمل حساب بسيط كجزء من الحجز، عشان تقدر تتابع مواعيدك.',

    'cta.title': 'جاهز تحجز؟',
    'cta.subtitle': 'لاقي ميعاد يناسبك في أقل من دقيقة.',
    'cta.button': 'احجز دلوقتي',

    'services.kicker': 'اللي بنقدمه',
    'services.title': 'خدماتنا',
    'services.empty': 'مفيش خدمات متاحة دلوقتي. تابعنا قريب.',
    'services.duration': 'دقيقة',
    'services.bookBtn': 'احجز',
    'services.viewAll': 'عرض كل الخدمات',

    'list.title': 'الخدمات',
    'list.count.one': 'خدمة متاحة',
    'list.count.many': 'خدمة متاحة',
    'list.search.placeholder': 'دور على خدمة…',
    'list.sort.label': 'ترتيب',
    'list.sort.relevance': 'موصى بيها',
    'list.sort.priceAsc': 'السعر: من الأقل للأعلى',
    'list.sort.priceDesc': 'السعر: من الأعلى للأقل',
    'list.sort.duration': 'المدة',
    'list.sort.name': 'الاسم (أ-ي)',
    'list.recent': 'عمليات بحث سابقة',
    'list.recent.clear': 'مسح',
    'list.results.for': 'نتيجة عن',
    'list.noResults.title': 'مفيش نتايج',
    'list.noResults.desc': 'مفيش خدمات مطابقة لـ',
    'list.noResults.clear': 'امسح البحث',
    'list.empty.title': 'مفيش خدمات لسه',
    'list.empty.desc': 'تابعنا قريب.',
    'list.bookNow': 'احجز دلوقتي',
    'list.price': 'السعر',

    'about.kicker': 'من نحن',

    'cal.back': 'رجوع للخدمات',
    'cal.step': 'اختار اليوم والوقت',
    'cal.pickDate.title': 'اختار يوم',
    'cal.pickDate.desc': 'اختار يوم من التقويم عشان تشوف المواعيد المتاحة.',
    'cal.slotsError.title': 'مقدرناش نجيب المواعيد',
    'cal.slotsError.desc': 'حصل خطأ. حاول تاني.',
    'cal.retry': 'حاول تاني',
    'cal.noAvail.title': 'مفيش مواعيد متاحة',
    'cal.noAvail.desc': 'مفيش مواعيد فاضية في',
    'cal.noAvail.tryOther': 'جرب يوم تاني.',
    'cal.slotCount.one': 'ميعاد',
    'cal.slotCount.many': 'مواعيد',
    'cal.selectedTime': 'الميعاد المختار',
    'cal.change': 'تغيير',
    'cal.continue': 'كمّل للتأكيد',
    'cal.serviceError': 'مقدرناش نجيب تفاصيل الخدمة.',
    'cal.at': 'الساعة',

    'confirm.changeDateTime': 'غيّر التاريخ أو الوقت',
    'confirm.summary': 'ملخص الحجز',
    'confirm.serviceError': 'مقدرناش نجيب تفاصيل الخدمة.',
    'confirm.signIn': 'سجّل دخول عشان تكمل',
    'confirm.createAccount': 'عمل حساب',
    'confirm.logIn': 'تسجيل الدخول',
    'confirm.firstName': 'الاسم الأول',
    'confirm.lastName': 'اسم العائلة',
    'confirm.email': 'الإيميل',
    'confirm.password': 'كلمة السر',
    'confirm.required': 'مطلوب',
    'confirm.validEmail': 'اكتب إيميل صحيح',
    'confirm.min8': 'أقل حاجة 8 حروف',
    'confirm.createBtn': 'اعمل حساب وكمّل',
    'confirm.creating': 'بنعمل الحساب…',
    'confirm.alreadyHave': 'عندك حساب بالفعل؟',
    'confirm.logInBtn': 'سجّل دخول وكمّل',
    'confirm.loggingIn': 'بنسجل دخولك…',
    'confirm.noAccount': 'معندكش حساب؟',
    'confirm.createOne': 'اعمل واحد',
    'confirm.confirmTitle': 'أكّد حجزك',
    'confirm.notes': 'ملاحظات',
    'confirm.optional': '(اختياري)',
    'confirm.notesPlaceholder': 'أي حاجة حابب تقولها لينا…',
    'confirm.confirmBtn': 'أكّد الحجز',
    'confirm.confirming': 'بنأكّد…',
    'confirm.bookingAs': 'بتحجز باسم',
    'confirm.success.title': 'تم حجزك!',
    'confirm.success.desc': 'الميعاد بتاعك اتأكد.',
    'confirm.bookAnother': 'احجز خدمة تانية',
    'confirm.backHome': 'رجوع للرئيسية',

    'footer.visit': 'زورنا',
    'footer.explore': 'استكشف',
    'footer.rights': 'كل الحقوق محفوظة.',

    'lang.switch': 'English',
  },
};
