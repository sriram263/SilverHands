import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, X, Sparkles, Volume2 } from 'lucide-react';

export const VoiceListeningModal = ({ isOpen, onClose, onVoiceCaptured, title = "Listening to Your Voice..." }) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(20);
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const resetSilenceTimer = () => {
    setSecondsRemaining(20);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // 20-second silence timer
    timeoutRef.current = setTimeout(() => {
      stopListening();
    }, 20000);

    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type directly.');
      onClose();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      resetSilenceTimer();
    };

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript + ' ';
      }
      setTranscript(currentTranscript.trim());
      resetSilenceTimer(); // Reset silence timer on every spoken word
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setSecondsRemaining(20);
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    stopListening();
    onVoiceCaptured(transcript);
    onClose();
  };

  const handleCancel = () => {
    stopListening();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-warm-xl p-6 sm:p-8 border border-warmgray-200 text-center space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-warmgray-100">
          <span className="badge-tag bg-saffron text-white font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Voice Input Active
          </span>
          <button onClick={handleCancel} className="p-1 rounded-xl text-warmgray-400 hover:bg-cream-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="font-heading text-xl font-bold text-warmgray-900">{title}</h3>

        {/* Pulsating Visualizer */}
        <div className="flex flex-col items-center justify-center py-4 space-y-3">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <div className="absolute w-28 h-28 bg-red-500/20 rounded-full animate-ping" />
            )}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-warm-lg transition-transform ${
              isListening ? 'bg-red-500 scale-110' : 'bg-warmgray-400'
            }`}>
              <Mic className="w-10 h-10" />
            </div>
          </div>
          
          <div className="text-xs font-semibold text-warmgray-500 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>{isListening ? `Speaking... (Auto-stops if silent for ${secondsRemaining}s)` : 'Recording paused'}</span>
          </div>
        </div>

        {/* Live Transcript Output */}
        <div className="p-4 bg-cream-50 rounded-2xl border border-warmgray-200 text-left min-h-[100px] max-h-40 overflow-y-auto">
          {transcript ? (
            <p className="text-sm text-warmgray-800 leading-relaxed font-medium">
              "{transcript}"
            </p>
          ) : (
            <p className="text-xs text-warmgray-400 italic text-center pt-6">
              Start speaking... your words will appear here in real-time.
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-ghost text-xs font-bold py-3"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="btn-primary text-xs font-bold py-3 flex items-center justify-center gap-2 shadow-warm"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Click to Stop & Apply</span>
          </button>
        </div>

      </div>
    </div>
  );
};
