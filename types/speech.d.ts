interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList; }
interface SpeechRecognition extends EventTarget { lang: string; onresult: ((event: SpeechRecognitionEvent) => void) | null; start(): void; }
interface SpeechRecognitionConstructor { new(): SpeechRecognition; }
interface Window { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor; }
