import React from 'react';
import { BookOpen, Youtube, ExternalLink, GraduationCap, Video, MessageSquare, Compass, Shield, Sparkles } from 'lucide-react';

interface ResourceItem {
  title: string;
  platform: string;
  type: string;
  icon: string;
  queryOrUrl: string;
  isDirectUrl?: boolean;
  desc: string;
}

export const ResourcesView: React.FC = () => {
  const enc = encodeURIComponent;

  const placementResources: ResourceItem[] = [
    {
      title: 'How to Answer "Tell Me About Yourself" for Campus Placements',
      platform: 'YouTube',
      type: 'Video Tutorial',
      icon: '▶️',
      queryOrUrl: 'how to answer tell me about yourself campus placement freshers',
      desc: 'Master the 90-second self introduction framework preferred by Indian campus interview panellists.',
    },
    {
      title: 'TCS & Infosys HR Interview Questions & Answers',
      platform: 'YouTube',
      type: 'Interview Guide (Hinglish)',
      icon: '🏢',
      queryOrUrl: 'tcs infosys hr interview questions and answers freshers hindi english',
      desc: 'Detailed breakdown of standard behavioural questions, relocation willingness, and domain tests.',
    },
    {
      title: 'Group Discussion (GD) Tips for Freshers',
      platform: 'YouTube',
      type: 'GD Strategies',
      icon: '👥',
      queryOrUrl: 'group discussion tips for engineering freshers campus placements',
      desc: 'How to enter a heated GD smoothly, generate structure, and summarize without interrupting aggressively.',
    },
    {
      title: 'How to Eliminate Fillers ("Matlab", "Basically", "Um")',
      platform: 'YouTube',
      type: 'Speech Exercise',
      icon: '🎯',
      queryOrUrl: 'how to stop using filler words basically matlab english speaking',
      desc: 'Practical exercises to turn awkward fillers into confident strategic pauses.',
    },
    {
      title: 'NPTEL Free Course: Soft Skills and Communication',
      platform: 'NPTEL India',
      type: 'Free College Certification',
      icon: '🎓',
      queryOrUrl: 'https://nptel.ac.in/courses/109/104/109104031/',
      isDirectUrl: true,
      desc: 'IIT Kanpur course on interpersonal communication, corporate writing, and team dynamics.',
    },
    {
      title: 'STAR Method for Behavioral Interview Questions',
      platform: 'Articles (Google)',
      type: 'Framework Guide',
      icon: '📄',
      queryOrUrl: 'STAR method interview answers examples freshers',
      desc: 'Structure every project and challenge story into Situation, Task, Action, and Result.',
    },
    {
      title: 'Toastmasters International Speaking Clubs',
      platform: 'Toastmasters',
      type: 'In-Person & Online Clubs',
      icon: '🎤',
      queryOrUrl: 'https://www.toastmasters.org/find-a-club',
      isDirectUrl: true,
      desc: 'Find a student or local Toastmasters chapter in your Indian city for supportive live practice.',
    },
    {
      title: 'Body Language & Posture for Video Interviews',
      platform: 'YouTube',
      type: 'Video Presence',
      icon: '📹',
      queryOrUrl: 'video interview body language tips eye contact posture',
      desc: 'Proper webcam framing, avoiding stiff posture, and using natural chest-level hand gestures.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="glass-panel p-6 sm:p-7 rounded-3xl">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Placement &amp; Communication Resources
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
          Hand-picked guides, video tutorials, and frameworks for Indian college students preparing for technical and HR rounds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {placementResources.map((item, idx) => {
          const targetUrl = item.isDirectUrl
            ? item.queryOrUrl
            : item.platform === 'YouTube'
            ? `https://www.youtube.com/results?search_query=${enc(item.queryOrUrl)}`
            : `https://www.google.com/search?q=${enc(item.queryOrUrl)}`;

          return (
            <a
              key={idx}
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 rounded-2xl glass-panel hover:border-indigo-500/40 hover:scale-[1.01] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-white/20 dark:border-white/10">
                    {item.platform} · {item.type}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/15 dark:border-white/10 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>Open Resource</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </a>
          );
        })}
      </div>

      {/* Hinglish Cheatsheet Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden space-y-4">
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-2 relative z-10">
          <span className="text-2xl">🇮🇳 ➔ 💼</span>
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            The Fresher's Quick Corporate English Cheatsheet
          </h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl relative z-10">
          Indian students often default to literal translations or casual fillers during placements. Use these immediate drop-in replacements:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs relative z-10">
          <div className="p-4 rounded-2xl glass-panel-subtle">
            <span className="text-rose-600 dark:text-rose-400 line-through block font-medium">"I pass out from college in 2026."</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-bold block mt-1.5">✔ "I will be graduating in 2026."</span>
          </div>

          <div className="p-4 rounded-2xl glass-panel-subtle">
            <span className="text-rose-600 dark:text-rose-400 line-through block font-medium">"Actually, matlab coding is my hobby."</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-bold block mt-1.5">✔ "I actively develop full-stack applications in my free time."</span>
          </div>

          <div className="p-4 rounded-2xl glass-panel-subtle">
            <span className="text-rose-600 dark:text-rose-400 line-through block font-medium">"I did a blunder in the final year project."</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-bold block mt-1.5">✔ "We encountered an architectural hurdle and refactored our design."</span>
          </div>

          <div className="p-4 rounded-2xl glass-panel-subtle">
            <span className="text-rose-600 dark:text-rose-400 line-through block font-medium">"I don't know this question."</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-bold block mt-1.5">✔ "I haven't worked with this framework yet, but I am familiar with the underlying concepts."</span>
          </div>
        </div>
      </div>
    </div>
  );
};
