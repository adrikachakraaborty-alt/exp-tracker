interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList; resultIndex: number; }
interface SpeechRecognition extends EventTarget { lang: string; continuous: boolean; interimResults: boolean; onresult: ((event: SpeechRecognitionEvent) => void) | null; onend: (() => void) | null; onerror: ((event: Event) => void) | null; start(): void; stop(): void; abort(): void; }
interface SpeechRecognitionConstructor { new(): SpeechRecognition; }
interface Window { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor; }
