'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAudioReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string;
  isSpeaking: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  error: string | null;
}

export function useAudio(): UseAudioReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size > 0) {
          setIsTranscribing(true);
          
          try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData,
            });
            
            const data = await response.json();
            
            if (data.text) {
              setTranscript(data.text);
            } else if (data.error) {
              setError(data.error);
            }
          } catch (err) {
            console.error('Transcription error:', err);
            setError('Failed to transcribe audio');
          } finally {
            setIsTranscribing(false);
          }
        }
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      setError(err.message || 'Failed to access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const speak = useCallback(async (text: string) => {
    if (!text) return;

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error('TTS API error');
        return;
      }

      const data = await response.json();
      
      if (data.audio) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
      }
    } catch (err) {
      console.error('TTS error:', err);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  return {
    isRecording,
    isTranscribing,
    transcript,
    isSpeaking,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
    error,
  };
}
