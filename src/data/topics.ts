import { Topic, PracticeMode, PracticeStat } from '../types';

export const INTERVIEW_CATEGORIES = [
  'All',
  'Self-introduction',
  'HR interview',
  'Technical interview',
  'Behavioral questions',
  'Group discussion',
  'Company-specific questions',
] as const;

export const RANDOM_TOPIC_CATEGORIES = [
  'All',
  'Daily life and social issues',
  'Technology and AI',
  'Education',
  'Environment',
  'Opinion and debate',
  'Storytelling and personal experiences',
  'Workplace communication',
  'Current affairs',
] as const;

export const INTERVIEW_TOPICS: Topic[] = [
  {
    id: 'intro',
    practiceMode: 'interview',
    tag: 'Self-introduction',
    icon: '💼',
    title: 'Tell me about yourself',
    desc: 'Introduce yourself, your academic background, core technical/functional skills, top projects, and why you are excited about this entry-level role.',
    tips: [
      'Do not repeat your resume line-by-line; tell your story.',
      'Use the Present-Past-Future framework: What you do now -> Key projects/internships -> Why this company.',
      'Aim for 90 to 120 seconds.',
    ],
    sampleOpener:
      'Good morning/afternoon. I am a final-year student specializing in Computer Science, with a passion for building scalable web apps...',
    resources: [
      {
        title: '90-Second Elevator Pitch Guide',
        type: 'Video Guide',
        url: 'https://www.youtube.com/results?search_query=tell+me+about+yourself+campus+placement+freshers',
      },
    ],
  },
  {
    id: 'intro_elevator',
    practiceMode: 'interview',
    tag: 'Self-introduction',
    icon: '🎙️',
    title: 'Introduce your academic journey and key strengths in 90 seconds',
    desc: 'Deliver a crisp first impression highlighting your degree, strongest technical or analytical skill, and one achievement you are proud of.',
    tips: [
      'Start with your current degree, specialization, and core focus area.',
      'Mention one concrete project or internship milestone with measurable impact.',
      'Close with how you want to contribute in your first year.',
    ],
    sampleOpener:
      'Hello! I am currently completing my undergraduate degree where I have focused on full-stack development and problem solving...',
  },
  {
    id: 'why_hire',
    practiceMode: 'interview',
    tag: 'HR interview',
    icon: '🏢',
    title: 'Why should we hire you?',
    desc: 'Explain how your skills, willingness to learn, and work ethic make you the ideal addition to their fresher training batch.',
    tips: [
      'Highlight your ability to learn new technologies quickly (give one proof).',
      'Mention your collaborative attitude in group academic projects.',
      'Show enthusiasm for their work culture.',
    ],
    sampleOpener:
      'You should hire me because as a fresher, I bring strong foundational problem-solving skills combined with high agility...',
  },
  {
    id: 'salary_fresher',
    practiceMode: 'interview',
    tag: 'HR interview',
    icon: '💰',
    title: 'What are your salary expectations and relocation preferences?',
    desc: 'State your expectation politely while aligning with company standards, learning opportunities, and industry benchmarks.',
    tips: [
      'As a fresher, prioritize mentorship, role exposure, and learning curve.',
      'Express trust in the company’s standardized fresher compensation bands.',
      'Clearly confirm flexibility for project locations and training centers.',
    ],
    sampleOpener:
      'As a fresher, my primary priority is joining an organization with high-growth engineering standards. I am comfortable with the company’s standard compensation structure...',
  },
  {
    id: 'career_5years',
    practiceMode: 'interview',
    tag: 'HR interview',
    icon: '🚀',
    title: 'Where do you see yourself in 3 to 5 years?',
    desc: 'Show ambition balanced with realistic milestones: mastering technical domain, leading modules, and mentoring incoming juniors.',
    tips: [
      'Avoid saying "I want to be in your chair" or "I want to start my own company immediately".',
      'Demonstrate commitment to continuous learning and technical certifications.',
    ],
    sampleOpener:
      'In 3 to 5 years, I see myself growing from an individual contributor into a senior module lead who designs robust features and mentors fresh recruits...',
  },
  {
    id: 'why_mass_recruiter',
    practiceMode: 'interview',
    tag: 'Company-specific questions',
    icon: '🌐',
    title: 'Why TCS / Infosys / Wipro / Accenture?',
    desc: 'Demonstrate that you have researched the organization, know their client domains, and see a strong learning curve in their onboarding and project allocations.',
    tips: [
      'Mention a specific initiative, training academy, or client transformation project.',
      'Express readiness for different domains, shifts, and global delivery standards.',
      'Avoid generic answers like "It is a big company".',
    ],
    sampleOpener:
      'I admire the company’s strong focus on digital transformation and structured fresher learning programs like Elevate and Wings1...',
  },
  {
    id: 'company_startup_vs_mnc',
    practiceMode: 'interview',
    tag: 'Company-specific questions',
    icon: '🏛️',
    title: 'What excites you most about our company’s products and engineering culture?',
    desc: 'Connect a specific product, recent launch, or engineering value of the company to your own skills and career interests.',
    tips: [
      'Reference a real product line, cloud platform, or customer problem the company solves.',
      'Link their tech stack or business model to a project you have built.',
      'Keep your tone enthusiastic, informed, and specific.',
    ],
    sampleOpener:
      'Following your recent engineering initiatives in cloud automation and customer experience, I am excited by how your teams solve problems at scale...',
  },
  {
    id: 'weakness',
    practiceMode: 'interview',
    tag: 'Behavioral questions',
    icon: '🎯',
    title: 'What is your biggest weakness?',
    desc: 'Pick an authentic professional limitation and clearly explain the active steps you are taking to overcome it.',
    tips: [
      'Never say "I have no weaknesses" or "I am a perfectionist".',
      'Choose something like public speaking or time-estimation, and demonstrate your improvement method.',
    ],
    sampleOpener:
      'Earlier, I used to hesitate asking questions in large team meetings, but recently I started writing down queries beforehand...',
  },
  {
    id: 'team_conflict',
    practiceMode: 'interview',
    tag: 'Behavioral questions',
    icon: '🤝',
    title: 'Describe a conflict during a college group project',
    desc: 'Use the STAR method (Situation, Task, Action, Result) to show emotional maturity, active listening, and conflict resolution.',
    tips: [
      'Focus on how you understood the other person’s point of view.',
      'Show that you prioritized the project deadline over personal ego.',
    ],
    sampleOpener:
      'During our 6th-semester hackathon, our team was divided between using Firebase vs PostgreSQL under a 24-hour deadline...',
  },
  {
    id: 'project_pitch',
    practiceMode: 'interview',
    tag: 'Technical interview',
    icon: '💻',
    title: 'Explain your final year project to a non-technical manager',
    desc: 'Strip away excessive jargon and explain the problem, your solution, your architecture, and the business impact simply.',
    tips: [
      'Use analogies instead of complex database schemas.',
      'State the real-world user pain point first.',
      'Clearly specify what part YOU built vs your teammates.',
    ],
    sampleOpener:
      'Imagine trying to book an emergency hospital bed in a crowded city; our app acts as a real-time aggregator...',
  },
  {
    id: 'tech_bug_debugged',
    practiceMode: 'interview',
    tag: 'Technical interview',
    icon: '🛠️',
    title: 'Walk me through a tough technical bug or bottleneck you solved',
    desc: 'Explain the symptom, how you isolated the root cause, the fix you implemented, and what you learned to prevent it in the future.',
    tips: [
      'Describe your debugging process step by step rather than jumping straight to the fix.',
      'Mention the tools or logs you inspected.',
      'State the quantifiable improvement (e.g., faster response time or zero crashes).',
    ],
    sampleOpener:
      'While building our project API, we noticed intermittent timeouts under concurrent requests. I systematically profiled the database queries and found...',
  },
  {
    id: 'gd_ai_jobs',
    practiceMode: 'interview',
    tag: 'Group discussion',
    icon: '👥',
    title: 'Is AI going to destroy or transform entry-level IT jobs?',
    desc: 'Share a balanced, data-backed perspective on generative AI, automation, and the shift from pure manual coding to AI-assisted engineering.',
    tips: [
      'Acknowledge both sides: routine tasks are automated, but need for domain problem-solvers is growing.',
      'Use structured transition phrases like "While it is true that..." and "On the contrary...".',
    ],
    sampleOpener:
      'Respected peers, in my view, AI is not replacing software engineers; it is elevating them into prompt architects and problem solvers...',
  },
  {
    id: 'gd_wfh',
    practiceMode: 'interview',
    tag: 'Group discussion',
    icon: '🏠',
    title: 'Work from Home vs Work from Office for Freshers',
    desc: 'Analyze the trade-offs of peer learning, informal mentorship, commuting stress, and productivity for newly graduated employees.',
    tips: [
      'Freshers benefit immensely from hallway conversations and peer debugging.',
      'Hybrid model usually offers the optimal balance.',
    ],
    sampleOpener:
      'Friends, while remote work offers flexibility, for freshers like us, office immersion accelerates mentorship and soft skill development...',
  },
];

export const RANDOM_TOPICS: Topic[] = [
  {
    id: 'rt_social_media_students',
    practiceMode: 'random',
    tag: 'Daily life and social issues',
    icon: '📱',
    title: 'Is social media useful for students?',
    desc: 'Discuss how social platforms help students learn, network, and discover opportunities versus distractions and screen-time fatigue.',
    tips: [
      'Start with a clear stance—social media is a powerful tool when used intentionally.',
      'Give 2 concrete examples (e.g., developer communities/educational channels vs doomscrolling).',
      'End with a practical habit for healthy digital balance.',
    ],
    sampleOpener:
      'Social media is like a double-edged sword for students today. When used purposefully for learning and networking, it opens doors that classrooms alone cannot...',
  },
  {
    id: 'rt_city_vs_hometown',
    practiceMode: 'random',
    tag: 'Daily life and social issues',
    icon: '🌆',
    title: 'Living in a fast-paced metro city vs a peaceful small town',
    desc: 'Compare career exposure, lifestyle pace, community warmth, and cost of living between big cities and smaller towns.',
    tips: [
      'Contrast career infrastructure in metros with quality of life in smaller towns.',
      'Include a personal observation from your own student or family life.',
      'Conclude with what matters most at different stages of life.',
    ],
    sampleOpener:
      'Moving from a quiet town to a bustling metro city changes how we view time, ambition, and community...',
  },
  {
    id: 'rt_ai_replace_jobs',
    practiceMode: 'random',
    tag: 'Technology and AI',
    icon: '🤖',
    title: 'Will AI replace human jobs?',
    desc: 'Explore how artificial intelligence is reshaping industries, automating repetitive tasks, and creating new human-in-the-loop roles.',
    tips: [
      'Avoid extreme predictions; distinguish task automation from whole-job replacement.',
      'Highlight uniquely human qualities like empathy, ethics, and creative judgment.',
      'Keep your pace steady (120–150 WPM) when explaining technical points.',
    ],
    sampleOpener:
      'Every major technological revolution has sparked fear of job loss, yet history shows technology transforms work rather than eliminating the need for human ingenuity...',
  },
  {
    id: 'rt_digital_privacy',
    practiceMode: 'random',
    tag: 'Technology and AI',
    icon: '🔐',
    title: 'Are we trading too much personal privacy for digital convenience?',
    desc: 'Speak about instant delivery apps, personalized recommendations, and smart devices versus data privacy and digital awareness.',
    tips: [
      'Give an everyday example like location tracking or targeted ads.',
      'Explain why awareness and digital literacy matter for young users.',
      'Wrap up with how users and tech companies can share responsibility.',
    ],
    sampleOpener:
      'From 10-minute grocery deliveries to instant UPI payments, convenience is at our fingertips—but it often comes with an invisible price tag: our personal data...',
  },
  {
    id: 'rt_college_attendance',
    practiceMode: 'random',
    tag: 'Education',
    icon: '🎓',
    title: 'Should college attendance be compulsory?',
    desc: 'Present a thoughtful view on mandatory 75% attendance rules versus self-paced project learning, internships, and classroom engagement.',
    tips: [
      'Acknowledge why colleges value classroom discipline and peer interaction.',
      'Explain why flexibility helps students pursuing internships, hackathons, and self-study.',
      'Propose a balanced middle ground (e.g., credit for lab work and active projects).',
    ],
    sampleOpener:
      'The debate around compulsory 75% college attendance touches every student. While regular classes build discipline, learning in college goes far beyond sitting in a lecture hall...',
  },
  {
    id: 'rt_skills_vs_marks',
    practiceMode: 'random',
    tag: 'Education',
    icon: '📚',
    title: 'Practical hands-on skills vs academic grades: What matters more today?',
    desc: 'Share your thoughts on how grades open initial doors while practical problem-solving and communication build long-term success.',
    tips: [
      'Frame grades and skills as complementary rather than enemies.',
      'Share an example where building something hands-on taught you more thanrote memorization.',
      'Use clear signposting ("First", "Second", "To conclude").',
    ],
    sampleOpener:
      'Academic grades may get our resume shortlisted, but it is our practical skills and ability to communicate ideas that truly solve real-world problems...',
  },
  {
    id: 'rt_reduce_pollution',
    practiceMode: 'random',
    tag: 'Environment',
    icon: '🌱',
    title: 'How can we reduce pollution?',
    desc: 'Speak about practical steps individuals, campuses, and cities can take to curb air, water, and plastic pollution.',
    tips: [
      'Structure your speech into Individual Habits, Community Action, and Policy/Technology.',
      'Mention relatable solutions like public transport, EV adoption, and waste segregation.',
      'Keep your tone constructive and action-oriented.',
    ],
    sampleOpener:
      'Reducing pollution is no longer a distant environmental goal—it directly affects the air we breathe and the water we drink every single day...',
  },
  {
    id: 'rt_sustainable_campus',
    practiceMode: 'random',
    tag: 'Environment',
    icon: '♻️',
    title: 'Simple ways students can make their college campus greener',
    desc: 'Propose realistic sustainability ideas such as paperless assignments, solar rooftops, eliminating single-use plastic in canteens, and tree drives.',
    tips: [
      'Pick 2 or 3 low-cost, high-impact campus initiatives.',
      'Explain how student clubs can lead by example.',
      'Finish with an inspiring call to action.',
    ],
    sampleOpener:
      'A college campus is like a mini-city of thousands of young minds, making it the perfect place to model sustainable living...',
  },
  {
    id: 'rt_online_vs_offline_learning',
    practiceMode: 'random',
    tag: 'Opinion and debate',
    icon: '⚖️',
    title: 'Online self-paced courses vs traditional classroom learning',
    desc: 'Debate the accessibility and global reach of online platforms against the mentorship, peer energy, and accountability of physical classrooms.',
    tips: [
      'State both pros and cons clearly before giving your final verdict.',
      'Avoid filler words when transitioning between contrasting arguments.',
      'Recommend a hybrid approach with a concrete example.',
    ],
    sampleOpener:
      'Online learning democratized world-class education overnight, yet the energy of a live classroom discussion remains hard to replicate on a screen...',
  },
  {
    id: 'rt_cashless_economy',
    practiceMode: 'random',
    tag: 'Opinion and debate',
    icon: '💳',
    title: 'Has digital payment made us spend more impulsively?',
    desc: 'Discuss how instant QR payments have simplified daily transactions while making micro-spending effortless for young adults.',
    tips: [
      'Share a relatable observation about scanning QR codes for small daily purchases.',
      'Discuss the benefits of transparency and digital records alongside budgeting habits.',
      'Conclude with a smart personal finance tip for students.',
    ],
    sampleOpener:
      'Paying with a quick QR scan takes less than three seconds, and while it has revolutionized convenience, it has also changed how we feel the weight of spending money...',
  },
  {
    id: 'rt_memorable_day',
    practiceMode: 'random',
    tag: 'Storytelling and personal experiences',
    icon: '🌟',
    title: 'Describe a memorable day in your life.',
    desc: 'Tell an engaging personal story about a day that brought you joy, pride, or a meaningful realization, focusing on vivid details and emotion.',
    tips: [
      'Set the scene briefly (where you were and why the day was special).',
      'Focus on the turning point or key moment of the day.',
      'Share why that memory still stays with you today.',
    ],
    sampleOpener:
      'One of the most memorable days of my life was the day my team presented our first working prototype in front of our entire department...',
  },
  {
    id: 'rt_mistake_lesson',
    practiceMode: 'random',
    tag: 'Storytelling and personal experiences',
    icon: '🧭',
    title: 'A mistake or setback that taught you an important life lesson',
    desc: 'Share an authentic story about a time things did not go as planned and how you adapted and grew stronger from the experience.',
    tips: [
      'Be honest and relatable—audiences connect with genuine reflection.',
      'Spend 40% on what happened and 60% on what you learned and changed afterward.',
      'Speak with calm vocal confidence and natural pauses.',
    ],
    sampleOpener:
      'We often learn very little from easy wins, but a setback I experienced during my second year of college completely changed how I prepare for deadlines...',
  },
  {
    id: 'rt_workplace_feedback',
    practiceMode: 'random',
    tag: 'Workplace communication',
    icon: '💬',
    title: 'How to communicate a project delay or roadblock professionally',
    desc: 'Practice delivering transparent, solution-oriented communication to a team lead or client when a task takes longer than expected.',
    tips: [
      'Never hide a delay until the last minute; communicate early with facts.',
      'Pair the roadblock with 2 concrete options or a revised timeline.',
      'Keep your tone accountable and calm rather than defensive.',
    ],
    sampleOpener:
      'Clear workplace communication shines brightest when things don’t go according to plan. When communicating a project blocker, transparency and solutions must go hand in hand...',
  },
  {
    id: 'rt_active_listening',
    practiceMode: 'random',
    tag: 'Workplace communication',
    icon: '👂',
    title: 'Why active listening is the most underrated communication skill',
    desc: 'Explain why great communicators listen to understand rather than just waiting for their turn to speak in meetings and teams.',
    tips: [
      'Define what active listening looks like in practice (paraphrasing, asking clarifying questions).',
      'Give an example of how miscommunication happens when teams don’t listen.',
      'Maintain steady eye contact with the camera.',
    ],
    sampleOpener:
      'When we think of great communicators, we usually picture confident speakers—yet the foundation of effective communication is actually active listening...',
  },
  {
    id: 'rt_india_digital_infra',
    practiceMode: 'random',
    tag: 'Current affairs',
    icon: '🇮🇳',
    title: 'How India’s Digital Public Infrastructure (UPI, Aadhaar, ONDC) is transforming daily life',
    desc: 'Speak about financial inclusion, street-vendor adoption of instant payments, and how digital public goods empower millions of citizens.',
    tips: [
      'Highlight how technology reached both metropolitan malls and local tea stalls.',
      'Mention the global recognition of India’s digital stack.',
      'Structure your points clearly from citizen impact to economic growth.',
    ],
    sampleOpener:
      'Over the last few years, India has achieved a digital transformation that took other economies decades—bringing instant digital payments to every corner of the country...',
  },
  {
    id: 'rt_ev_future',
    practiceMode: 'random',
    tag: 'Current affairs',
    icon: '⚡',
    title: 'The rise of Electric Vehicles and clean mobility in Indian cities',
    desc: 'Discuss the rapid growth of electric two-wheelers, buses, and charging infrastructure alongside battery and grid challenges.',
    tips: [
      'Cover both the momentum (two-wheelers and delivery fleets) and hurdles (charging stations).',
      'Keep your delivery crisp, informative, and well-paced.',
      'Conclude with what the next 5 years of urban transport could look like.',
    ],
    sampleOpener:
      'Step onto any busy Indian street today and you will notice green number plates on two-wheelers, three-wheelers, and city buses—signaling a major shift toward clean mobility...',
  },
];

// Keep TOPICS exported with all topics so existing imports continue to work seamlessly
export const TOPICS: Topic[] = [...INTERVIEW_TOPICS, ...RANDOM_TOPICS];

export function getTopicsByPracticeMode(practiceMode: PracticeMode): Topic[] {
  return practiceMode === 'random' ? RANDOM_TOPICS : INTERVIEW_TOPICS;
}

export function getRandomTopic(category?: string, excludeId?: string): Topic {
  const pool =
    category && category !== 'All'
      ? RANDOM_TOPICS.filter((t) => t.tag.toLowerCase() === category.toLowerCase())
      : RANDOM_TOPICS;
  const effectivePool = pool.length > 0 ? pool : RANDOM_TOPICS;
  const candidates =
    effectivePool.length > 1 && excludeId
      ? effectivePool.filter((t) => t.id !== excludeId)
      : effectivePool;
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex] || RANDOM_TOPICS[0];
}

export function detectPracticeModeFromStat(stat: Partial<PracticeStat> & { practiceMode?: PracticeMode }): PracticeMode {
  if (stat.practiceMode === 'random' || stat.practiceMode === 'interview') {
    return stat.practiceMode;
  }
  const id = (stat.topicId || '').toLowerCase();
  const cat = (stat.category || '').toLowerCase();
  if (
    id.startsWith('rt_') ||
    id.startsWith('random-') ||
    cat.startsWith('random topic') ||
    RANDOM_TOPIC_CATEGORIES.some((rc) => rc !== 'All' && cat.includes(rc.toLowerCase()))
  ) {
    return 'random';
  }
  return 'interview';
}

export const HINGLISH_FILLERS = new Set([
  'matlab',
  'toh',
  'basically',
  'actually',
  'yaani',
  'yani',
  'na',
  'um',
  'uh',
  'like',
  'aur',
  'mtlb',
  'sort of',
  'kind of',
  'you know',
  'मतलब',
  'तो',
  'बेसिकली',
  'एक्चुअली',
  'यानी',
  'ना',
  'और',
]);

export function countFillers(words: string[]): { total: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  let total = 0;
  for (const w of words) {
    const clean = w.toLowerCase().replace(/[.,!?;:\"\'।\(\)]/g, '').trim();
    if (HINGLISH_FILLERS.has(clean)) {
      total++;
      breakdown[clean] = (breakdown[clean] || 0) + 1;
    }
  }
  return { total, breakdown };
}

