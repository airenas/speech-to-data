export interface TranscriptionSegment {
  segment: number;
  transcript: string;
  final: boolean;
}

export interface TranscriptionResponse {
  status: number;
  segment: number;
  event: string;
  'transcription-id'?: string;
  result?: {
    final: boolean;
    transcript?: string;
    hypotheses?: { transcript: string; confidence: number }[];
    [key: string]: unknown;
  };
  'old-updates'?: TranscriptionSegment[];
  [key: string]: unknown;
}

export interface ServerStatus {
  num_workers_available: number;
  [key: string]: unknown;
}

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
  onPartialResults?: (data: TranscriptionResponse) => void;
  onResults?: (data: TranscriptionResponse) => void;
  onServerStatus?: (data: ServerStatus) => void;
  onEndOfSession?: () => void;
  onEvent?: (eventType: number, data: string | Blob | ArrayBuffer | undefined) => void;
  rafCallback?: (time: number) => void;
}

export interface ServerStatusCode {
  [key: number]: string;
}

export interface WebSocketEvent extends Event {
  data?: string | Blob | ArrayBuffer;
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
