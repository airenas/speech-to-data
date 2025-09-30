export interface ConfigOptions {
  server?: string;
  statusServer?: string;
  sampleRate?: number;
  contentType?: string;
  onError?: (type: number, error: string) => void;
  onReadyForSpeech?: () => void;
  onEndOfSpeech?: () => void;
  onStartTranscription?: (id: string) => void;
  onStopTranscription?: (final: boolean) => void;
  onCommand?: (command: string) => void;
  onPartialResults?: (data: any) => void;
  onResults?: (data: any) => void;
  onServerStatus?: (data: any) => void;
  onEndOfSession?: () => void;
  onEvent?: (eventType: number, data: any) => void;
  rafCallback?: (time: number) => void;
}

export interface SpeechSegment {
  segment: number;
  transcript: string;
  final: boolean;
}

export interface ServerStatusCode {
  [key: number]: string;
}

export interface WebSocketEvent extends Event {
  data?: any;
}

export enum TranscriptionEvent {
  START_TRANSCRIPTION = 'START_TRANSCRIPTION',
  STOPPING_TRANSCRIPTION = 'STOPPING_TRANSCRIPTION',
  STOP_TRANSCRIPTION = 'STOP_TRANSCRIPTION',
  TRANSCRIPTION = 'TRANSCRIPTION',
  COPY_COMMAND = 'COPY_COMMAND',
  SELECT_ALL_COMMAND = 'SELECT_ALL_COMMAND',
  STOP_LISTENING_COMMAND = 'STOP_LISTENING_COMMAND',
}
