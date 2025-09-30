export type TranscriptionView = {
  id: string;
  content: string;
  selected: boolean;
};

export enum TranscriberStatus {
  IDLE,
  LISTENING,
  TRANSCRIBING,
  STOPPING,
}
