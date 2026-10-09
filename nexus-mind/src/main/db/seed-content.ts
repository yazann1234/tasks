/**
 * Demo content in English and Arabic. The language matching the user's
 * locale is seeded on first launch so the app feels native from second one.
 *
 * `due` / `start` are day offsets from today (negative = past);
 * `hour` is the local hour for the due time.
 */
import type { SupportedLocale } from '@shared/locale';
import type { Priority, TaskStatus } from '@shared/domain';

export interface SeedProject {
  key: string;
  name: string;
  color: string;
  icon: string;
}

export interface SeedTask {
  project: string | null;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  urgent: boolean;
  important: boolean;
  due?: number;
  hour?: number;
  estimate?: number;
  recurrence?: string;
  tags: string[];
  subtasks?: string[];
  blockedBy?: string;
}

export interface SeedNote {
  title: string;
  body: string;
  pinned?: boolean;
}

export interface SeedHabit {
  name: string;
  icon: string;
  color: string;
  targetPerWeek: number;
  /** Probability of completion on a given day, for realistic heatmaps. */
  adherence: number;
}

export interface SeedContent {
  projects: SeedProject[];
  tasks: SeedTask[];
  notes: SeedNote[];
  habits: SeedHabit[];
  journal: string[];
}

const en: SeedContent = {
  projects: [
    { key: 'launch', name: 'Product Launch', color: '#7C3AED', icon: 'rocket' },
    { key: 'health', name: 'Health & Energy', color: '#06B6D4', icon: 'heart-pulse' },
    { key: 'learn', name: 'Learning', color: '#F59E0B', icon: 'graduation-cap' },
  ],
  tasks: [
    { project: 'launch', title: 'Finalize launch narrative', description: 'One-page story: problem, insight, product, proof.', status: 'in_progress', priority: 3, urgent: true, important: true, due: 0, hour: 17, estimate: 90, tags: ['writing', 'launch'], subtasks: ['Draft problem statement', 'Collect three customer quotes', 'Review with Sara'] },
    { project: 'launch', title: 'Record product demo video', status: 'todo', priority: 3, urgent: false, important: true, due: 3, hour: 12, estimate: 120, tags: ['video'], blockedBy: 'Finalize launch narrative' },
    { project: 'launch', title: 'Fix onboarding crash on Windows', status: 'todo', priority: 3, urgent: true, important: true, due: -1, hour: 10, estimate: 60, tags: ['bug'] },
    { project: 'launch', title: 'Prepare press kit', status: 'todo', priority: 2, urgent: false, important: true, due: 6, hour: 15, estimate: 90, tags: ['marketing'] },
    { project: 'launch', title: 'Reply to partnership emails', status: 'inbox', priority: 1, urgent: true, important: false, due: 1, hour: 11, estimate: 30, tags: ['email'] },
    { project: 'launch', title: 'Write release notes', status: 'done', priority: 2, urgent: false, important: true, due: -2, tags: ['writing'] },
    { project: 'health', title: 'Morning run', status: 'todo', priority: 2, urgent: false, important: true, due: 1, hour: 7, estimate: 40, recurrence: 'FREQ=WEEKLY;BYDAY=MO,WE,FR', tags: ['habit'] },
    { project: 'health', title: 'Book annual check-up', status: 'todo', priority: 2, urgent: false, important: true, due: 9, hour: 9, estimate: 15, tags: ['admin'] },
    { project: 'health', title: 'Meal prep for the week', status: 'done', priority: 1, urgent: false, important: true, due: -3, tags: ['home'] },
    { project: 'learn', title: 'Read "Deep Work" — chapter 4', status: 'todo', priority: 1, urgent: false, important: true, due: 4, hour: 21, estimate: 45, tags: ['reading'] },
    { project: 'learn', title: 'Finish TypeScript generics course', status: 'in_progress', priority: 2, urgent: false, important: true, due: 12, estimate: 180, tags: ['course'] },
    { project: 'learn', title: 'Monthly learning retro', status: 'todo', priority: 1, urgent: false, important: false, due: 14, hour: 18, estimate: 30, recurrence: 'FREQ=MONTHLY;BYDAY=2TU', tags: ['review'] },
    { project: null, title: 'Call Sara about the venue', status: 'inbox', priority: 2, urgent: true, important: false, due: 2, hour: 16, estimate: 15, tags: ['call'] },
    { project: null, title: 'Organize desktop screenshots', status: 'inbox', priority: 0, urgent: false, important: false, tags: [] },
  ],
  notes: [
    { title: 'Launch Plan', pinned: true, body: '# Launch Plan\n\nGoal: 1,000 active users in 30 days.\n\n- Narrative lives in [[Messaging Pillars]]\n- Risks tracked in [[Launch Risks]]\n- Weekly sync notes: [[Weekly Review]]\n' },
    { title: 'Messaging Pillars', body: '# Messaging Pillars\n\n1. **Instant** — every action under 100ms.\n2. **Intelligent** — the AI does the busywork.\n3. **Private** — local-first, E2E encrypted.\n\nSee [[Launch Plan]].' },
    { title: 'Launch Risks', body: '# Launch Risks\n\n| Risk | Mitigation |\n|---|---|\n| Windows crash | Hotfix before demo |\n| Demo slips | Record fallback cut |\n\nBack to [[Launch Plan]].' },
    { title: 'Weekly Review', body: '# Weekly Review\n\n- What moved the needle?\n- What drained energy?\n- One thing to stop.\n\nEnergy notes: [[Energy Patterns]]' },
    { title: 'Energy Patterns', body: '# Energy Patterns\n\nPeak focus: **9:00–11:30**. Slump after lunch → schedule admin.\n\nFormula: $E = \\frac{sleep \\times movement}{context\\ switches}$' },
  ],
  habits: [
    { name: 'Meditate', icon: 'brain', color: '#7C3AED', targetPerWeek: 7, adherence: 0.78 },
    { name: 'Exercise', icon: 'dumbbell', color: '#06B6D4', targetPerWeek: 4, adherence: 0.6 },
    { name: 'Read 20 pages', icon: 'book-open', color: '#F59E0B', targetPerWeek: 5, adherence: 0.7 },
  ],
  journal: [
    'Shipped the release notes. Felt sharp in the morning.',
    'Too many meetings. Protect mornings tomorrow.',
    'Great run, clear head. Deep work session went long.',
    'Slept badly; kept tasks light.',
    'Breakthrough on the narrative — the insight finally clicked.',
  ],
};

const ar: SeedContent = {
  projects: [
    { key: 'launch', name: 'إطلاق المنتج', color: '#7C3AED', icon: 'rocket' },
    { key: 'health', name: 'الصحة والطاقة', color: '#06B6D4', icon: 'heart-pulse' },
    { key: 'learn', name: 'التعلّم', color: '#F59E0B', icon: 'graduation-cap' },
  ],
  tasks: [
    { project: 'launch', title: 'اعتماد قصة الإطلاق', description: 'صفحة واحدة: المشكلة، الفكرة، المنتج، الدليل.', status: 'in_progress', priority: 3, urgent: true, important: true, due: 0, hour: 17, estimate: 90, tags: ['كتابة', 'إطلاق'], subtasks: ['صياغة بيان المشكلة', 'جمع ثلاث شهادات عملاء', 'مراجعتها مع سارة'] },
    { project: 'launch', title: 'تسجيل فيديو عرض المنتج', status: 'todo', priority: 3, urgent: false, important: true, due: 3, hour: 12, estimate: 120, tags: ['فيديو'], blockedBy: 'اعتماد قصة الإطلاق' },
    { project: 'launch', title: 'إصلاح تعطّل الترحيب على ويندوز', status: 'todo', priority: 3, urgent: true, important: true, due: -1, hour: 10, estimate: 60, tags: ['خلل'] },
    { project: 'launch', title: 'تجهيز الحقيبة الإعلامية', status: 'todo', priority: 2, urgent: false, important: true, due: 6, hour: 15, estimate: 90, tags: ['تسويق'] },
    { project: 'launch', title: 'الرد على رسائل الشراكات', status: 'inbox', priority: 1, urgent: true, important: false, due: 1, hour: 11, estimate: 30, tags: ['بريد'] },
    { project: 'launch', title: 'كتابة ملاحظات الإصدار', status: 'done', priority: 2, urgent: false, important: true, due: -2, tags: ['كتابة'] },
    { project: 'health', title: 'الجري الصباحي', status: 'todo', priority: 2, urgent: false, important: true, due: 1, hour: 7, estimate: 40, recurrence: 'FREQ=WEEKLY;BYDAY=SU,TU,TH', tags: ['عادة'] },
    { project: 'health', title: 'حجز الفحص السنوي', status: 'todo', priority: 2, urgent: false, important: true, due: 9, hour: 9, estimate: 15, tags: ['إداري'] },
    { project: 'health', title: 'تحضير وجبات الأسبوع', status: 'done', priority: 1, urgent: false, important: true, due: -3, tags: ['منزل'] },
    { project: 'learn', title: 'قراءة الفصل الرابع من «العمل العميق»', status: 'todo', priority: 1, urgent: false, important: true, due: 4, hour: 21, estimate: 45, tags: ['قراءة'] },
    { project: 'learn', title: 'إنهاء دورة TypeScript المتقدمة', status: 'in_progress', priority: 2, urgent: false, important: true, due: 12, estimate: 180, tags: ['دورة'] },
    { project: 'learn', title: 'مراجعة التعلّم الشهرية', status: 'todo', priority: 1, urgent: false, important: false, due: 14, hour: 18, estimate: 30, recurrence: 'FREQ=MONTHLY;BYDAY=2TU', tags: ['مراجعة'] },
    { project: null, title: 'الاتصال بسارة بخصوص القاعة', status: 'inbox', priority: 2, urgent: true, important: false, due: 2, hour: 16, estimate: 15, tags: ['اتصال'] },
    { project: null, title: 'ترتيب لقطات الشاشة على سطح المكتب', status: 'inbox', priority: 0, urgent: false, important: false, tags: [] },
  ],
  notes: [
    { title: 'خطة الإطلاق', pinned: true, body: '# خطة الإطلاق\n\nالهدف: ١٠٠٠ مستخدم نشط خلال ٣٠ يومًا.\n\n- الرسائل الأساسية في [[ركائز الرسالة]]\n- المخاطر في [[مخاطر الإطلاق]]\n- ملاحظات المتابعة: [[المراجعة الأسبوعية]]\n' },
    { title: 'ركائز الرسالة', body: '# ركائز الرسالة\n\n١. **فوري** — كل إجراء في أقل من ١٠٠ ملّي ثانية.\n٢. **ذكي** — الذكاء الاصطناعي يتولى الأعمال الروتينية.\n٣. **خاص** — بياناتك محلية ومشفّرة طرفيًا.\n\nراجع [[خطة الإطلاق]].' },
    { title: 'مخاطر الإطلاق', body: '# مخاطر الإطلاق\n\n| الخطر | المعالجة |\n|---|---|\n| تعطّل ويندوز | إصلاح عاجل قبل العرض |\n| تأخر العرض | تسجيل نسخة احتياطية |\n\nالعودة إلى [[خطة الإطلاق]].' },
    { title: 'المراجعة الأسبوعية', body: '# المراجعة الأسبوعية\n\n- ما الذي أحدث فرقًا؟\n- ما الذي استنزف طاقتي؟\n- أمر واحد سأتوقف عنه.\n\nملاحظات الطاقة: [[أنماط الطاقة]]' },
    { title: 'أنماط الطاقة', body: '# أنماط الطاقة\n\nذروة التركيز: **٩:٠٠–١١:٣٠**. هبوط بعد الغداء ← أعمال إدارية.\n\n$E = \\frac{sleep \\times movement}{context\\ switches}$' },
  ],
  habits: [
    { name: 'التأمل', icon: 'brain', color: '#7C3AED', targetPerWeek: 7, adherence: 0.78 },
    { name: 'الرياضة', icon: 'dumbbell', color: '#06B6D4', targetPerWeek: 4, adherence: 0.6 },
    { name: 'قراءة ٢٠ صفحة', icon: 'book-open', color: '#F59E0B', targetPerWeek: 5, adherence: 0.7 },
  ],
  journal: [
    'أنجزت ملاحظات الإصدار. كان ذهني صافيًا صباحًا.',
    'اجتماعات كثيرة. سأحمي ساعات الصباح غدًا.',
    'جري رائع وذهن صافٍ. جلسة العمل العميق امتدت طويلًا.',
    'نوم متقطع؛ أبقيت المهام خفيفة.',
    'انفراجة في قصة الإطلاق — الفكرة اتضحت أخيرًا.',
  ],
};

export const SEED_CONTENT: Readonly<Record<SupportedLocale, SeedContent>> = { en, ar };
