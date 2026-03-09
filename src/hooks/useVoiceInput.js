import { useState, useRef, useCallback } from 'react'

export function useVoiceInput({ language = 'en', onResult }) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported] = useState(() => 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  const recognitionRef = useRef(null)

  const start = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isSupported, language, onResult])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return { isListening, isSupported, start, stop }
}
