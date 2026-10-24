import React, { useState, useEffect, useRef } from 'react';
import { Topic, AnalysisResult, PracticeMode } from '../types';
import {
  TOPICS,
  INTERVIEW_TOPICS,
  RANDOM_TOPICS,
  INTERVIEW_CATEGORIES,
  RANDOM_TOPIC_CATEGORIES,
  getRandomTopic,
  countFillers,
} from '../data/topics';
import { analyzePracticeWithGemini } from '../services/api';
import { 
  Video, 
  Mic, 
  Square, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck, 
  Lightbulb, 
  Play, 
  Edit3,
  RefreshCw,
  Shuffle,
  Briefcase,
  ExternalLink
} from 'lucide-react';

interface PracticeStudioProps {
  initialTopic?: Topic;
  initialMode?: 'video' | 'audio';
  initialPracticeMode?: PracticeMode;
  onModeChange?: (mode: 'video' | 'audio') => void;
  onPracticeModeChange?: (practiceMode: PracticeMode) => void;
  onTopicChange?: (topic: Topic) => void;
  onAnalysisComplete: (result: {
    analysis: AnalysisResult;
    stats: {
      topicId: string;
      topicTitle: string;
      category: string;
      mode: 'video' | 'audio';
      practiceMode: PracticeMode;
      score: number;
      wpm: number;
      fillerCount: number;
      fillerRatePerMin: number;
      wordCount: number;
      durationSeconds: number;
      primaryIssue: string;
      postureScore: number | null;
      gestureStatus: string | null;
    };
  }) => void;
  onBack: () => void;
}

export const PracticeStudio: React.FC<PracticeStudioProps> = ({
  initialTopic,
  initialMode = 'video',
  initialPracticeMode = 'interview',
  onModeChange,
  onPracticeModeChange,
  onTopicChange,
  onAnalysisComplete,
  onBack,
}) => {
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(
    initialTopic?.practiceMode || initialPracticeMode
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<Topic>(
    initialTopic || (initialPracticeMode === 'random' ? RANDOM_TOPICS[0] : INTERVIEW_TOPICS[0])
  );
  const [mode, setMode] = useState<'video' | 'audio'>(initialMode);
  const [topicSelectionMode, setTopicSelectionMode] = useState<'curated' | 'custom'>('curated');
  const [customTopicTitle, setCustomTopicTitle] = useState('');
  const [customTopicCategory, setCustomTopicCategory] = useState('Daily life and social issues');
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [transcriptText, setTranscriptText] = useState('');
  const [manualText, setManualText] = useState('');
  const [isManualEditOpen, setIsManualEditOpen] = useState(true);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Ready to record');
  const [postureStatus, setPostureStatus] = useState<string>('Ready');
  const [slouchAvg, setSlouchAvg] = useState<number | null>(null);
  const [gestureStatus, setGestureStatus] = useState<string>('normal');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [speechRecError, setSpeechRecError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTopic) {
      setSelectedTopic(initialTopic);
      if (initialTopic.practiceMode) {
        setPracticeMode(initialTopic.practiceMode);
      }
      const isCurated = TOPICS.some((t) => t.id === initialTopic.id);
      if (!isCurated) {
        setTopicSelectionMode('custom');
        setCustomTopicTitle(initialTopic.title);
        setCustomTopicCategory(initialTopic.tag || 'General Speaking');
      } else {
        setTopicSelectionMode('curated');
      }
    }
  }, [initialTopic]);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (initialPracticeMode && initialPracticeMode !== practiceMode) {
      setPracticeMode(initialPracticeMode);
    }
  }, [initialPracticeMode]);

  const handleSelectPracticeMode = (nextPracticeMode: PracticeMode) => {
    if (isRecording) return;
    setPracticeMode(nextPracticeMode);
    setSelectedCategory('All');
    setTopicSelectionMode('curated');
    if (onPracticeModeChange) {
      onPracticeModeChange(nextPracticeMode);
    }
    if (nextPracticeMode === 'random') {
      const nextRandom =
        selectedTopic.practiceMode === 'random' ? selectedTopic : getRandomTopic('All');
      setSelectedTopic(nextRandom);
      setCustomTopicCategory('Daily life and social issues');
      if (onTopicChange) onTopicChange(nextRandom);
    } else {
      const nextInterview =
        selectedTopic.practiceMode === 'interview' ? selectedTopic : INTERVIEW_TOPICS[0];
      setSelectedTopic(nextInterview);
      setCustomTopicCategory('HR interview');
      if (onTopicChange) onTopicChange(nextInterview);
    }
  };

  const handlePickRandomTopic = (categoryOverride?: string) => {
    if (isRecording) return;
    const cat = categoryOverride ?? selectedCategory;
    const nextTopic = getRandomTopic(cat, selectedTopic.id);
    setTopicSelectionMode('curated');
    setPracticeMode('random');
    setSelectedTopic(nextTopic);
    if (onPracticeModeChange) onPracticeModeChange('random');
    if (onTopicChange) onTopicChange(nextTopic);
  };

  const activeCategoryList =
    practiceMode === 'random' ? RANDOM_TOPIC_CATEGORIES : INTERVIEW_CATEGORIES;
  const modeTopicPool =
    practiceMode === 'random' ? RANDOM_TOPICS : INTERVIEW_TOPICS;
  const filteredCuratedTopics =
    selectedCategory === 'All'
      ? modeTopicPool
      : modeTopicPool.filter((t) => t.tag.toLowerCase() === selectedCategory.toLowerCase());

  const activeTopic: Topic =
    topicSelectionMode === 'custom' && customTopicTitle.trim().length > 0
      ? {
          id:
            (practiceMode === 'random' ? 'rt_custom_' : 'iv_custom_') +
            customTopicTitle
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 28),
          practiceMode,
          tag: customTopicCategory || (practiceMode === 'random' ? 'Daily life and social issues' : 'HR interview'),
          icon: practiceMode === 'random' ? '🎲' : '💼',
          title: customTopicTitle.trim(),
          desc:
            practiceMode === 'random'
              ? `Spontaneous speaking topic in "${customTopicCategory}". Share a clear opening idea, 2 relatable examples, and a memorable conclusion.`
              : `Custom interview prompt in "${customTopicCategory}". Deliver a structured, confident response using real examples.`,
          tips:
            practiceMode === 'random'
              ? [
                  'Start with an engaging 15-second hook or clear opinion.',
                  'Support your view with 2 everyday examples or personal observations.',
                  'Maintain a natural speaking rhythm and pause instead of using filler words.',
                ]
              : [
                  'Open with a direct, structured 15-second headline statement.',
                  'Back up your key points with a specific academic, project, or practical example (STAR method).',
                  'Maintain a steady 120–150 WPM cadence and pause instead of using filler crutches.',
                ],
          sampleOpener:
            practiceMode === 'random'
              ? `When we think about "${customTopicTitle.trim()}", one key perspective that stands out in our daily lives is...`
              : `Regarding "${customTopicTitle.trim()}", I would like to share a structured perspective based on my academic projects and hands-on experience...`,
        }
      : selectedTopic;

  const handleSelectMode = (nextMode: 'video' | 'audio') => {
    if (isRecording) return;
    setMode(nextMode);
    if (nextMode === 'audio') {
      setSlouchAvg(null);
      setPostureStatus('Audio-only mode');
      setGestureStatus('audio-only');
    } else {
      setPostureStatus('Ready');
      setGestureStatus('normal');
    }
    if (onModeChange) {
      onModeChange(nextMode);
    }
  };

  const handleSelectCuratedTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    if (topic.practiceMode && topic.practiceMode !== practiceMode) {
      setPracticeMode(topic.practiceMode);
      if (onPracticeModeChange) onPracticeModeChange(topic.practiceMode);
    }
    if (onTopicChange) {
      onTopicChange(topic);
    }
  };

  // Synchronous refs to guarantee latest value on click (no stale state)
  const latestEditorTextRef = useRef<string>('');
  const hasUserEditedManualRef = useRef<boolean>(false);
  const hasRecordedSessionRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  const speechRecFailedRef = useRef<boolean>(false);
  const manualTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const analyzeInFlightRef = useRef<boolean>(false);
  const latestSecondsLeftRef = useRef<number>(120);

  // Live metrics
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveFillerCount, setLiveFillerCount] = useState(0);

  // References
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Native In-Browser Video Vision Analyzer refs (zero external weights, 0 TensorFlow dependencies)
  const canvasAnalyzerRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const poseTimerRef = useRef<any>(null);
  const poseBaseRef = useRef<number[]>([]);
  const baseRatioRef = useRef<number | null>(null);
  const poseSamplesRef = useRef<number[]>([]);
  const gestureDeltasRef = useRef<number[]>([]);

  // Clean up all media on unmount
  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, []);

  // Clean up all media on unmount
  const cleanupMedia = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (poseTimerRef.current) {
      clearInterval(poseTimerRef.current);
      poseTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    // Clean up temporary Blob URL to never persist recordings
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
      setRecordedBlobUrl(null);
    }
  };

  // Start Camera & Mic
  const startRecording = async () => {
    setAnalysisError(null);
    setSpeechRecError(null);
    speechRecFailedRef.current = false;
    setTranscriptText('');
    // Preserve manually typed text if the user already typed in the editor; otherwise reset for live speech
    if (!hasUserEditedManualRef.current || !latestEditorTextRef.current.trim()) {
      setManualText('');
      latestEditorTextRef.current = '';
      hasUserEditedManualRef.current = false;
    }
    hasRecordedSessionRef.current = false;
    latestSecondsLeftRef.current = 120;
    setSecondsLeft(120);
    setLiveWpm(0);
    setLiveFillerCount(0);
    setSlouchAvg(null);
    recordedChunksRef.current = [];

    // Reset video posture & gesture tracking data
    poseBaseRef.current = [];
    baseRatioRef.current = null;
    poseSamplesRef.current = [];
    gestureDeltasRef.current = [];
    prevFrameDataRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'video',
      });
      mediaStreamRef.current = stream;

      if (mode === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      // Initialize MediaRecorder
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || (mode === 'video' ? 'video/webm' : 'audio/webm');
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const localUrl = URL.createObjectURL(blob);
        setRecordedBlobUrl(localUrl);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(1000);

      // Initialize Speech Recognition
      startSpeechRecognition();

      // Initialize Pose loop if in video mode
      if (mode === 'video') {
        startPoseTracking();
      }

      hasRecordedSessionRef.current = true;
      isRecordingRef.current = true;
      setIsRecording(true);
      setStatusMessage('Recording in progress...');

      // 120s Countdown timer
      timerIntervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          const next = prev <= 1 ? 0 : prev - 1;
          latestSecondsLeftRef.current = next;
          if (next === 0) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting media:', err);
      isRecordingRef.current = false;
      setIsRecording(false);
      setIsManualEditOpen(true);
      setStatusMessage('Microphone/Camera permission denied. You can still type your practice response below.');
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      speechRecFailedRef.current = true;
      setSpeechRecError(
        'Live speech transcription is not supported in this browser. Your recording is still active — please use the Manual Practice Editor below to type or paste your response.'
      );
      setIsManualEditOpen(true);
      setStatusMessage('Live speech recognition not supported in this browser. Please type or paste your response below.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'hi-IN'; // Optimized for Indian English & Hinglish accent
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let full = '';
        for (let i = 0; i < event.results.length; i++) {
          full += event.results[i][0].transcript + ' ';
        }
        const text = full.trim();
        if (text) {
          speechRecFailedRef.current = false;
          setSpeechRecError(null);
        }
        setTranscriptText(text);

        // Keep editor and latest ref synchronized unless user manually edited or cleared the editor
        if (!hasUserEditedManualRef.current) {
          latestEditorTextRef.current = text;
          setManualText(text);
        }

        // Calculate live metrics
        const words = text ? text.split(/\s+/).filter(Boolean) : [];
        const elapsed = 120 - latestSecondsLeftRef.current;
        if (elapsed >= 5) {
          const wpmCalc = Math.round(words.length / (elapsed / 60));
          setLiveWpm(wpmCalc);
          const { total } = countFillers(words);
          setLiveFillerCount(total);
        }
      };

      recognition.onerror = (e: any) => {
        const errCode = String(e?.error || '').toLowerCase();
        if (errCode === 'no-speech' || errCode === 'aborted') {
          return;
        }
        console.warn('Speech recognition warning:', errCode);
        speechRecFailedRef.current = true;
        setIsManualEditOpen(true);

        if (errCode === 'network') {
          setSpeechRecError(
            'Browser live speech transcription is currently unavailable due to a speech-service network error. Your microphone recording is still active (this does NOT mean you did not speak). You can type or edit your response in the Manual Practice Editor below at any time.'
          );
        } else if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          setSpeechRecError(
            'Browser speech transcription permission or service is blocked. Please type or paste your response in the Manual Practice Editor below.'
          );
        } else {
          setSpeechRecError(
            `Live speech transcription is unavailable (${errCode || 'recognition error'}). Please use the Manual Practice Editor below to type or edit your response.`
          );
        }
      };

      recognition.onend = () => {
        // Do not loop-restart speech recognition if a network/service error occurred
        if (isRecordingRef.current && !speechRecFailedRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition initialization error:', err);
      speechRecFailedRef.current = true;
      setIsManualEditOpen(true);
      setSpeechRecError(
        'Could not initialize browser speech recognition. Please type or paste your response in the Manual Practice Editor below.'
      );
    }
  };

  const startPoseTracking = () => {
    setPostureStatus('Calibrating posture (sit upright)...');
    poseTimerRef.current = setInterval(() => {
      const video = videoPreviewRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;

      try {
        if (!canvasAnalyzerRef.current) {
          const c = document.createElement('canvas');
          c.width = 64;
          c.height = 48;
          canvasAnalyzerRef.current = c;
        }
        const canvas = canvasAnalyzerRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, 64, 48);
        const frame = ctx.getImageData(0, 0, 64, 48);
        const data = frame.data;

        // 1. Posture detection: Track vertical centroid of head & shoulders (rows 4 to 28)
        let weightedY = 0;
        let totalLum = 0;
        for (let y = 4; y < 28; y++) {
          for (let x = 16; x < 48; x++) {
            const idx = (y * 64 + x) * 4;
            const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            weightedY += y * lum;
            totalLum += lum;
          }
        }
        const currentCenterY = totalLum > 0 ? weightedY / totalLum : 16;

        if (baseRatioRef.current === null) {
          poseBaseRef.current.push(currentCenterY);
          if (poseBaseRef.current.length >= 10) {
            const sorted = [...poseBaseRef.current].sort((a, b) => a - b);
            baseRatioRef.current = sorted[Math.floor(sorted.length / 2)];
            setPostureStatus('Posture: Tracking Active');
          }
        } else {
          const baseline = baseRatioRef.current;
          const drop = Math.max(0, currentCenterY - baseline);
          const slouch = Math.min(1, drop / 3.0);
          poseSamplesRef.current.push(slouch);

          const currentSlouch = poseSamplesRef.current.slice(-10);
          const avg = currentSlouch.reduce((a, b) => a + b, 0) / currentSlouch.length;
          const roundedAvg = Number(avg.toFixed(2));
          setSlouchAvg(roundedAvg);

          if (roundedAvg < 0.28) {
            setPostureStatus('Posture: Upright & Confident ✨');
          } else if (roundedAvg < 0.50) {
            setPostureStatus('Posture: Fair (keep shoulders back)');
          } else {
            setPostureStatus('Posture: Slouching detected ⚠️');
          }
        }

        // 2. Gesture detection: Track movement dynamics in torso/hand zone (rows 28 to 48)
        if (prevFrameDataRef.current) {
          const prev = prevFrameDataRef.current;
          let diff = 0;
          let count = 0;
          for (let y = 28; y < 48; y += 2) {
            for (let x = 8; x < 56; x += 2) {
              const idx = (y * 64 + x) * 4;
              const d = Math.abs(data[idx] - prev[idx]) +
                        Math.abs(data[idx + 1] - prev[idx + 1]) +
                        Math.abs(data[idx + 2] - prev[idx + 2]);
              diff += d / 3;
              count++;
            }
          }
          const motion = count > 0 ? diff / count : 0;
          gestureDeltasRef.current.push(motion);
          const recent = gestureDeltasRef.current.slice(-12);
          const motionAvg = recent.reduce((a, b) => a + b, 0) / recent.length;

          if (motionAvg > 12) {
            setGestureStatus('expressive');
          } else if (motionAvg > 3) {
            setGestureStatus('normal');
          } else {
            setGestureStatus('stiff');
          }
        }

        prevFrameDataRef.current = new Uint8ClampedArray(data);
      } catch (err) {
        // Safe canvas frame capture
      }
    }, 250);
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (poseTimerRef.current) {
      clearInterval(poseTimerRef.current);
      poseTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    setStatusMessage('Recording stopped. Review your metrics and click "Analyze Practice" below.');

    // Summarize gesture status from canvas motion delta
    if (gestureDeltasRef.current.length > 5) {
      const avgMoves = gestureDeltasRef.current.reduce((a, b) => a + b, 0) / gestureDeltasRef.current.length;
      if (avgMoves < 3) setGestureStatus('Stiff (hands stationary)');
      else if (avgMoves > 16) setGestureStatus('Fidgety (moving rapidly)');
      else setGestureStatus('Natural hand gestures');
    }
  };

  // Trigger Gemini AI Analysis
  const handleAnalyze = async () => {
    if (analyzing || analyzeInFlightRef.current) return; // Prevent duplicate clicks

    // Read latest manual editor value BEFORE stopping recording so nothing can overwrite it
    const rawDomEditorVal =
      manualTextareaRef.current !== null ? manualTextareaRef.current.value : null;
    const liveEditorValue =
      rawDomEditorVal !== null
        ? rawDomEditorVal
        : latestEditorTextRef.current !== '' || hasUserEditedManualRef.current
        ? latestEditorTextRef.current
        : manualText;

    // If the user explicitly edited or cleared the manual editor, strictly use that value
    // and never fall back to an older speech transcript.
    const currentText = hasUserEditedManualRef.current
      ? liveEditorValue.trim()
      : (liveEditorValue.trim() || transcriptText.trim());

    // If recording is still in progress, gracefully stop first
    if (isRecording || isRecordingRef.current) {
      stopRecording();
      await new Promise((r) => setTimeout(r, 350));
    }

    // Only consider recorded audio if the user did NOT manually clear the editor and no manual/transcribed text is already available
    const hasRecordedAudio =
      !hasUserEditedManualRef.current &&
      currentText.length === 0 &&
      Boolean(recordedChunksRef.current && recordedChunksRef.current.length > 0);

    // Validate that user entered non-whitespace text or recorded speech
    if (!currentText && !hasRecordedAudio) {
      if (speechRecFailedRef.current) {
        setIsManualEditOpen(true);
        setAnalysisError(
          'Browser live speech transcription was unavailable (network error). Please type or summarize your response in the Manual Practice Editor above (or click "Fill with Topic Opener") before analyzing.'
        );
      } else {
        setAnalysisError(
          'Please speak into your microphone or type your response in the practice editor before analyzing.'
        );
      }
      return;
    }

    analyzeInFlightRef.current = true;
    setAnalyzing(true);
    setAnalysisError(null);

    const finalSpeech = currentText;
    let audioBase64: string | undefined;
    let audioMimeType: string | undefined;

    // Only send recorded audio if user did not provide manual/transcribed text and audio chunks exist
    if (!finalSpeech && hasRecordedAudio) {
      try {
        const mimeType = mediaRecorderRef.current?.mimeType || (mode === 'video' ? 'video/webm' : 'audio/webm');
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        audioBase64 = btoa(binary);
        audioMimeType = mimeType;
      } catch (e) {
        console.warn('Audio preparation note:', e);
      }
    }

    const rawRecordedSeconds = hasRecordedSessionRef.current
      ? Math.max(0, 120 - latestSecondsLeftRef.current)
      : 0;
    const words = finalSpeech ? finalSpeech.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;

    // Calculate WPM ONLY when actual speaking duration was measured (do not invent duration or WPM for manual typed text)
    const elapsed =
      hasRecordedSessionRef.current && rawRecordedSeconds > 0
        ? rawRecordedSeconds
        : 0;

    const { total: fillerCount, breakdown } = countFillers(words);
    const computedWpm =
      elapsed > 0 && wordCount > 0
        ? Math.round(wordCount / (elapsed / 60))
        : elapsed > 0 && liveWpm > 0
        ? liveWpm
        : 0;
    const fillerRate =
      elapsed > 0 ? Number((fillerCount / (elapsed / 60)).toFixed(1)) : 0;
    const detectedFillersList = Object.keys(breakdown);

    try {
      const analysis = await analyzePracticeWithGemini({
        topicTitle: activeTopic.title,
        category: activeTopic.tag,
        mode,
        practiceMode,
        speechSnippet: finalSpeech,
        audioBase64,
        audioMimeType,
        speechRecognitionFailed: speechRecFailedRef.current,
        wpm: computedWpm,
        durationSeconds: elapsed,
        fillerCount,
        detectedFillers: detectedFillersList,
        postureSummary:
          mode === 'video' && slouchAvg !== null
            ? { slouchScore: slouchAvg, postureLabel: postureStatus }
            : null,
        gestureSummary: mode === 'video' && hasRecordedSessionRef.current ? { status: gestureStatus } : null,
      });

      // Complete analysis callback
      onAnalysisComplete({
        analysis,
        stats: {
          topicId: activeTopic.id,
          topicTitle: activeTopic.title,
          category: activeTopic.tag,
          mode,
          practiceMode,
          score: analysis.score,
          wpm: computedWpm,
          fillerCount,
          fillerRatePerMin: fillerRate,
          wordCount,
          durationSeconds: elapsed,
          primaryIssue: analysis.primaryBottleneck,
          postureScore: mode === 'video' ? slouchAvg : null,
          gestureStatus: mode === 'video' && hasRecordedSessionRef.current ? gestureStatus : null,
        },
      });
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setAnalysisError(err?.message || 'Coaching analysis failed. Please check connection and retry.');
    } finally {
      analyzeInFlightRef.current = false;
      setAnalyzing(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </button>

        {/* Media Mode Selector (Video & Audio vs Audio Only) */}
        <div className="flex items-center p-1 rounded-2xl glass-panel-subtle border border-white/30 dark:border-white/10 shadow-sm">
          <button
            type="button"
            onClick={() => handleSelectMode('video')}
            disabled={isRecording}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'video'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video &amp; Audio</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectMode('audio')}
            disabled={isRecording}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'audio'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Audio Only</span>
          </button>
        </div>
      </div>

      {/* FEATURE 1: Two Practice Mode Cards (A. Random Topic Practice vs B. Interview Practice) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          type="button"
          disabled={isRecording}
          onClick={() => handleSelectPracticeMode('random')}
          className={`text-left glass-panel rounded-2xl p-4 border transition-all flex items-start gap-3.5 ${
            practiceMode === 'random'
              ? 'border-cyan-500 dark:border-cyan-400 ring-2 ring-cyan-500/20 shadow-lg'
              : 'border-white/30 dark:border-white/10 hover:border-cyan-400/50 opacity-85 hover:opacity-100'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Shuffle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                A. Random Topic Practice
              </span>
              {practiceMode === 'random' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500 text-white">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              General communication, fluency, debates, storytelling &amp; spontaneous speaking
            </p>
          </div>
        </button>

        <button
          type="button"
          disabled={isRecording}
          onClick={() => handleSelectPracticeMode('interview')}
          className={`text-left glass-panel rounded-2xl p-4 border transition-all flex items-start gap-3.5 ${
            practiceMode === 'interview'
              ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 shadow-lg'
              : 'border-white/30 dark:border-white/10 hover:border-indigo-400/50 opacity-85 hover:opacity-100'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                B. Interview Practice
              </span>
              {practiceMode === 'interview' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              HR, Technical, Self-introduction, Behavioral, Group Discussion &amp; Company questions
            </p>
          </div>
        </button>
      </div>

      {/* Topic Card & Selector */}
      <div className="glass-panel rounded-3xl p-5 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl space-y-4">
        {/* Practice Prompt Mode Switcher & Random Topic Generator */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/15 dark:border-white/10">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/40 dark:bg-slate-900/50 border border-white/30 dark:border-white/10">
            <button
              type="button"
              disabled={isRecording}
              onClick={() => setTopicSelectionMode('curated')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                topicSelectionMode === 'curated'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {practiceMode === 'random' ? '🎲 Curated Random Topics' : '🎯 Guided Interview Questions'}
            </button>
            <button
              type="button"
              disabled={isRecording}
              onClick={() => setTopicSelectionMode('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                topicSelectionMode === 'custom'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ✨ Custom Topic
            </button>
          </div>

          <div className="flex items-center gap-2">
            {practiceMode === 'random' && (
              <>
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => handlePickRandomTopic(selectedCategory)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Random Topic</span>
                </button>
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => handlePickRandomTopic(selectedCategory)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/60 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-white/40 dark:border-white/10 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Another Topic</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Category Filter Pills (for Curated mode) */}
        {topicSelectionMode === 'curated' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {activeCategoryList.map((cat) => (
              <button
                key={cat}
                type="button"
                disabled={isRecording}
                onClick={() => {
                  setSelectedCategory(cat);
                  const matching =
                    cat === 'All'
                      ? modeTopicPool
                      : modeTopicPool.filter((t) => t.tag.toLowerCase() === cat.toLowerCase());
                  if (matching.length > 0 && !matching.some((m) => m.id === selectedTopic.id)) {
                    handleSelectCuratedTopic(matching[0]);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/40 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3.5">
            <span className="text-3xl p-2.5 rounded-2xl bg-white/40 dark:bg-white/10 shadow-sm">
              {activeTopic.icon}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    practiceMode === 'random'
                      ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/25'
                      : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25'
                  }`}
                >
                  {practiceMode === 'random' ? '🎲 Random Topic Practice' : '💼 Interview Practice'}
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-white/30 dark:border-white/10">
                  {activeTopic.tag}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                {activeTopic.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                {activeTopic.desc}
              </p>
            </div>
          </div>

          {/* Change topic selector or custom topic inputs */}
          {topicSelectionMode === 'curated' ? (
            <select
              value={selectedTopic.id}
              onChange={(e) => {
                const found = TOPICS.find((t) => t.id === e.target.value);
                if (found) handleSelectCuratedTopic(found);
              }}
              disabled={isRecording}
              className="text-xs font-bold py-2.5 px-3.5 rounded-xl border border-white/30 dark:border-white/10 bg-white/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 max-w-xs"
            >
              {filteredCuratedTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.title} ({t.tag})
                </option>
              ))}
            </select>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <input
                type="text"
                disabled={isRecording}
                value={customTopicTitle}
                onChange={(e) => setCustomTopicTitle(e.target.value)}
                placeholder={
                  practiceMode === 'random'
                    ? 'Enter any speaking or debate topic...'
                    : 'Enter custom interview question...'
                }
                className="text-xs font-semibold py-2 px-3 rounded-xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 min-w-[220px]"
              />
              <select
                disabled={isRecording}
                value={customTopicCategory}
                onChange={(e) => setCustomTopicCategory(e.target.value)}
                className="text-xs font-bold py-2 px-3 rounded-xl border border-white/30 dark:border-white/10 bg-white/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                {activeCategoryList
                  .filter((c) => c !== 'All')
                  .map((catOption) => (
                    <option key={catOption} value={catOption}>
                      {catOption}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Helpful Tips and Sample Opener */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 space-y-1.5">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {practiceMode === 'random'
                  ? 'Spontaneous Speaking Tips'
                  : 'Interview Answer Strategy'}
              </span>
            </div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
              {activeTopic.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-500/20 space-y-1.5">
            <div className="font-bold text-indigo-900 dark:text-cyan-300 flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                <span>💬</span>
                <span>Suggested Opening Hook</span>
              </span>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  activeTopic.title + ' ' + (practiceMode === 'random' ? 'public speaking ideas' : 'interview answer')
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-indigo-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Prep Videos</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="italic text-indigo-800 dark:text-cyan-200 leading-relaxed">
              "{activeTopic.sampleOpener}"
            </p>
          </div>
        </div>
      </div>

      {/* Recording Studio Box */}
      <div className="glass-panel rounded-3xl p-5 sm:p-8 border border-white/30 dark:border-white/10 shadow-2xl space-y-6">
        {/* Timer Bar */}
        <div>
          <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              {isRecording && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 pulse-recording inline-block" />}
              <span>{statusMessage}</span>
            </span>
            <span className="font-mono text-sm font-black text-slate-900 dark:text-white tabular-nums">
              {formatTimer(120 - secondsLeft)} / 02:00
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800/80 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isRecording 
                  ? 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-rose-500' 
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${((120 - secondsLeft) / 120) * 100}%` }}
            />
          </div>
        </div>

        {/* Video Preview Box (if mode === 'video') */}
        {mode === 'video' ? (
          <div className="relative aspect-video max-h-[400px] w-full rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-white/20 dark:border-white/10 shadow-2xl">
            <video
              ref={videoPreviewRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover scale-x-[-1] ${isRecording ? 'block' : 'hidden'}`}
            />
            {!isRecording && (
              <div className="text-center p-6 text-slate-400">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 flex items-center justify-center text-3xl mb-3 border border-white/10 shadow-lg">
                  📹
                </div>
                <p className="text-sm font-bold text-slate-200">Webcam Camera Viewport</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Sit upright with shoulders in frame. MediaPipe WebAssembly tracks posture and hand gestures locally.
                </p>
              </div>
            )}

            {/* Posture Badge Overlay */}
            {isRecording && (
              <div className="absolute top-3.5 right-3.5 px-3 py-1.5 rounded-xl text-xs font-bold glass-panel-elevated text-white border border-white/20 flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>{postureStatus}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-gradient-to-b from-indigo-500/10 via-cyan-500/5 to-transparent border border-white/20 dark:border-white/10 text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-cyan-400 flex items-center justify-center mb-3 shadow-inner">
              <Mic className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Audio-Only Speech Practice
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Focus on vocal modulation, articulation, pace (120–150 WPM), and eliminating Hinglish filler words like <em>"basically"</em> and <em>"matlab"</em>.
            </p>
          </div>
        )}

        {/* Live Metrics Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 text-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Fillers Detected
            </span>
            <div className="text-xl font-black text-amber-500 mt-0.5 font-mono tabular-nums">
              {liveFillerCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 text-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Speaking WPM
            </span>
            <div className="text-xl font-black text-indigo-600 dark:text-cyan-400 mt-0.5 font-mono tabular-nums">
              {liveWpm > 0 ? liveWpm : '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 text-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Slouch Ratio
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono tabular-nums">
              {slouchAvg !== null ? slouchAvg : '—'}
            </div>
          </div>
        </div>

        {/* Large Accessible Recording Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex-1 py-4 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 active:scale-[0.99] text-white shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition-all"
            >
              <span className="w-3 h-3 rounded-full bg-white shadow-sm" />
              <span>Start Practice Drill (2 Minutes)</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex-1 py-4 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.99] text-white shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2.5 transition-all"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop &amp; Review Response</span>
            </button>
          )}
        </div>

        {/* Live Transcript / Speech Recognition Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/10 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span>🎙️ Spoken Words Recognition (Hinglish / hi-IN)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsManualEditOpen(!isManualEditOpen)}
              className="text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isManualEditOpen ? 'Hide Text Editor' : 'Type or Edit Answer'}</span>
            </button>
          </div>

          {speechRecError && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <div className="font-bold">Live Browser Speech Recognition Unavailable</div>
                <p className="leading-relaxed">{speechRecError}</p>
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-white/60 dark:bg-slate-950/60 border border-white/40 dark:border-white/10 text-xs sm:text-sm text-slate-800 dark:text-slate-200 min-h-[75px] max-h-40 overflow-y-auto leading-relaxed">
            {transcriptText || (
              <span className="text-slate-400 italic">
                {speechRecError
                  ? 'Live browser transcription is offline. Please type or edit your response in the Manual Practice Editor below.'
                  : 'Speech recognition will capture your answer live as you speak. If you prefer to type, use the Manual Practice Editor below.'}
              </span>
            )}
          </div>

          {isManualEditOpen && (
            <div className="pt-2 animate-in fade-in duration-150 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Manual / Edited Practice Response:
                </label>
                <div className="flex items-center gap-3">
                  {manualText.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        hasUserEditedManualRef.current = true;
                        latestEditorTextRef.current = '';
                        setManualText('');
                      }}
                      className="text-[11px] font-bold text-rose-500 hover:underline"
                    >
                      Clear Text
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      hasUserEditedManualRef.current = true;
                      latestEditorTextRef.current = activeTopic.sampleOpener;
                      setManualText(activeTopic.sampleOpener);
                      setAnalysisError(null);
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>✨ Fill with Topic Opener</span>
                  </button>
                </div>
              </div>
              <textarea
                ref={manualTextareaRef}
                value={manualText}
                onChange={(e) => {
                  const nextVal = e.target.value;
                  hasUserEditedManualRef.current = true;
                  latestEditorTextRef.current = nextVal;
                  setManualText(nextVal);
                  if (nextVal.trim().length > 0 && analysisError) {
                    setAnalysisError(null);
                  }
                }}
                placeholder="Type or paste your spoken response here to analyze directly (works even without microphone recording)..."
                className="w-full p-3 text-xs sm:text-sm rounded-xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-slate-950/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 min-h-[90px]"
              />
            </div>
          )}
        </div>

        {/* Local In-Memory Playback */}
        {recordedBlobUrl && (
          <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/10 space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Play className="w-4 h-4 text-cyan-400" />
              <span>Instant Local In-Memory Playback</span>
            </div>
            {mode === 'video' ? (
              <video
                src={recordedBlobUrl}
                controls
                playsInline
                className="w-full max-h-64 rounded-xl bg-black"
              />
            ) : (
              <audio src={recordedBlobUrl} controls className="w-full mt-1" />
            )}
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              🔒 This media exists strictly in your browser RAM and is discarded after practice.
            </p>
          </div>
        )}

        {/* Error message with Retry option */}
        {analysisError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{analysisError}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  hasUserEditedManualRef.current = true;
                  latestEditorTextRef.current = activeTopic.sampleOpener;
                  setManualText(activeTopic.sampleOpener);
                  setIsManualEditOpen(true);
                  setAnalysisError(null);
                }}
                className="py-1 px-2.5 rounded-lg text-xs font-bold bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-white/40 dark:border-white/10 hover:bg-white transition-colors"
              >
                Use Sample Opener
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="py-1 px-3 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Retry Analysis
              </button>
            </div>
          </div>
        )}

        {/* Big CTA: Analyze with Gemini AI */}
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full py-4 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 active:scale-[0.99] text-white shadow-xl shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-all"
        >
          {analyzing ? (
            <>
              <RefreshCw className="w-4 h-4 text-cyan-200 animate-spin" />
              <span>AI Placement Coach Analyzing Speech Metrics...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Analyze Practice with Gemini AI →</span>
            </>
          )}
        </button>

        {/* Privacy Notice */}
        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Zero Server Storage: Audio/video never uploaded or stored</span>
        </div>
      </div>
    </div>
  );
};
