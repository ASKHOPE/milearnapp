import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Attachment } from '../types';
import { Mic, Square, X, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVoiceNote: (attachment: Attachment) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isOpen,
  onClose,
  onSaveVoiceNote
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.error('Error stopping recorder', e);
      }
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setDuration(0);
    setErrorMsg(null);
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone recording is not supported in this browser environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
          const voiceAttachment: Attachment = {
            id: 'voice-' + Math.random().toString(36).substring(2, 11),
            name: `Voice-Memo-${timestamp}.webm`,
            type: 'audio',
            size: audioBlob.size,
            mimeType: audioBlob.type,
            dataUrl: base64Data,
            createdAt: new Date().toISOString()
          };
          onSaveVoiceNote(voiceAttachment);
          onClose();
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start(200);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to access microphone', err);
      setErrorMsg(err.message || 'Could not access microphone');
      setIsRecording(false);
    }
  }, [onClose, onSaveVoiceNote]);

  useEffect(() => {
    if (isOpen) {
      startRecording();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen, startRecording, cleanup]);

  const handleStopAndSave = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="voice-recorder-bar">
      {errorMsg ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '12px' }}>{errorMsg}</span>
          <button className="editor-icon-btn" onClick={onClose} style={{ marginLeft: 'auto' }}>
            <X size={15} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="recording-pulse" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mic size={16} color="var(--color-danger)" />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                {isRecording ? 'Recording Voice Note' : 'Preparing Mic...'}
              </span>
              <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--color-danger)', fontWeight: 700 }}>
                {formatTimer(duration)}
              </span>
            </div>

            {/* Audio pulse bars visual */}
            <div className="audio-bars">
              <span /><span /><span /><span /><span />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="btn-new-note"
              style={{ background: 'var(--color-danger)', padding: '5px 12px', fontSize: '12px' }}
              onClick={handleStopAndSave}
              title="Stop and save recording into note"
            >
              <Square size={13} fill="white" />
              <span>Finish & Save</span>
            </button>
            <button className="editor-icon-btn" onClick={onClose} title="Cancel recording">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
