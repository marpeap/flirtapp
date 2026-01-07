'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function VoiceRecorder({ conversationId, userId, onMessageSent, onClose }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const MAX_DURATION = 20; // 20 secondes max

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return d + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Erreur micro:', err);
      setError('Impossible d\'accéder au microphone. Vérifie les permissions.');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }

  function resetRecording() {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    setError('');
  }

  async function sendVoiceMessage() {
    if (!audioBlob || !conversationId || !userId) return;

    setUploading(true);
    setError('');

    try {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceRecorder.js:87',message:'sendVoiceMessage entry',data:{conversationId,userId,audioBlobSize:audioBlob?.size},timestamp:Date.now(),sessionId:'debug-session',runId:'voice-upload',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion

      // 1) Upload vers Supabase Storage
      // Le chemin doit correspondre à la politique RLS : pushes/{userId}/...
      const fileName = `pushes/${userId}/voice_${Date.now()}.webm`;
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceRecorder.js:95',message:'Before storage upload',data:{fileName,bucket:'voice-messages'},timestamp:Date.now(),sessionId:'debug-session',runId:'voice-upload',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false,
        });

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceRecorder.js:103',message:'Storage upload result',data:{hasError:!!uploadError,errorMessage:uploadError?.message,errorStatusCode:uploadError?.statusCode,hasData:!!uploadData,dataPath:uploadData?.path},timestamp:Date.now(),sessionId:'debug-session',runId:'voice-upload',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion

      if (uploadError) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VoiceRecorder.js:108',message:'Storage upload error details',data:{errorMessage:uploadError.message,errorStatusCode:uploadError.statusCode,errorStatusText:uploadError.statusText,errorContext:uploadError.context},timestamp:Date.now(),sessionId:'debug-session',runId:'voice-upload',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        
        // Message d'erreur plus clair pour "Bucket not found"
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          throw new Error('Le bucket "voice-messages" n\'existe pas. Veuillez le créer dans Supabase Storage (voir mobile/create_storage_buckets.md)');
        }
        throw new Error(uploadError.message);
      }

      // 2) Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

      const voiceUrl = urlData.publicUrl;

      // 3) Insérer le message
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: '',
          message_type: 'voice',
          voice_url: voiceUrl,
          voice_duration: duration,
        })
        .select('id, sender_id, content, created_at, message_type, voice_url, voice_duration')
        .single();

      if (msgError) {
        throw new Error(msgError.message);
      }

      // 4) Callback et fermer
      if (onMessageSent) {
        onMessageSent(msgData);
      }
      onClose();
    } catch (err) {
      console.error('Erreur envoi vocal:', err);
      setError(err.message || 'Erreur lors de l\'envoi du message vocal');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e, #0f0f23)',
          borderRadius: 20,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb', margin: 0 }}>
            🎤 Message Vocal
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#fca5a5',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ✕ Fermer
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
          Enregistre un message vocal (max {MAX_DURATION}s)
        </p>

        {error && (
          <p style={{ fontSize: 12, color: '#f87171', marginBottom: 12, background: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 8 }}>
            {error}
          </p>
        )}

        {/* Timer */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: recording ? '#ef4444' : '#60a5fa',
              fontFamily: 'monospace',
            }}
          >
            {String(Math.floor(duration / 60)).padStart(2, '0')}:{String(duration % 60).padStart(2, '0')}
          </div>
          <div
            style={{
              height: 4,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              marginTop: 10,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(duration / MAX_DURATION) * 100}%`,
                background: recording
                  ? 'linear-gradient(90deg, #ef4444, #f97316)'
                  : 'linear-gradient(90deg, #3b82f6, #10b981)',
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>

        {/* Lecture */}
        {audioUrl && !recording && (
          <div style={{ marginBottom: 20 }}>
            <audio controls src={audioUrl} style={{ width: '100%', height: 40 }} />
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {!recording && !audioBlob && (
            <button
              onClick={startRecording}
              style={{
                padding: '14px 28px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              🔴 Enregistrer
            </button>
          )}

          {recording && (
            <button
              onClick={stopRecording}
              style={{
                padding: '14px 28px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              ⏹️ Arrêter
            </button>
          )}

          {audioBlob && !recording && (
            <>
              <button
                onClick={resetRecording}
                style={{
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#fca5a5',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🔄 Refaire
              </button>
              <button
                onClick={sendVoiceMessage}
                disabled={uploading}
                style={{
                  padding: '12px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: uploading ? 'wait' : 'pointer',
                  opacity: uploading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {uploading ? '⏳ Envoi...' : '📤 Envoyer'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
