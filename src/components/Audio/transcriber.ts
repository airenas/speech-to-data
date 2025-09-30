import { serverUrl } from '@/config';
import { addAuth } from '@/utils/auth';

import {
  ConfigOptions,
  ServerStatus,
  ServerStatusCode,
  TranscriptionEvent,
  TranscriptionResponse,
  WebSocketEvent,
} from './types';

// Server status codes
const SERVER_STATUS_CODE: ServerStatusCode = {
  0: 'Success',
  1: 'No speech',
  2: 'Aborted',
  9: 'No available',
};

const ERR_NETWORK = 2;
const ERR_SERVER = 4;
const ERR_CLIENT = 5;

const MSG_SEND = 5;
const MSG_SEND_EMPTY = 6;
const MSG_SEND_EOS = 7;
const MSG_WEB_SOCKET = 8;
const MSG_WEB_SOCKET_OPEN = 9;
const MSG_WEB_SOCKET_CLOSE = 10;

export class Config implements ConfigOptions {
  server = `${serverUrl}/speech`;
  statusServer = `${serverUrl}/status`;
  sampleRate = 16000;
  contentType =
    'content-type=audio/x-raw,+layout=(string)interleaved,+rate=(int)16000,+format=(string)S16LE,+channels=(int)1';
  onError: (type: number, error: string) => void = (et, e) => {
    console.error(et, e);
  };
  onReadyForSpeech: () => void = () => {
    console.log('onReadyForSpeech');
  };
  onStartTranscription: (id: string) => void = (id) => {
    console.log('onStartTranscription', id);
  };
  onStopTranscription: (final: boolean) => void = (final) => {
    console.log('onStopTranscription', final);
  };
  onEndOfSpeech: () => void = () => {
    console.log('onEndOfSpeech');
  };
  onPartialResults: (data: TranscriptionResponse) => void = (data) => {
    console.log('onPartialResults ' + data);
  };
  onResults: (data: TranscriptionResponse) => void = (data) => {
    console.log('onResults ' + data);
  };
  onServerStatus: (data: ServerStatus) => void = (data) => {
    console.log('onServerStatus ' + data);
  };
  onEndOfSession: () => void = () => {
    console.log('onEndOfSession');
  };
  onEvent: (eventType: number, data: string | Blob | ArrayBuffer | undefined) => void = (
    e,
    _data,
  ) => {
    console.log('onEvent ' + e);
  };
  rafCallback: (time: number) => void = (_time) => {
    console.log('rafCallback');
  };
  onCommand?: (command: string) => void = (command) => {
    console.log('onCommand', command);
  };
}

export class KaldiRTTranscriber {
  private ws: WebSocket | null = null;
  private wsStatus: WebSocket | null = null;
  statusReconnectInterval = 1000;
  isTranscriberReady = false;
  isTranscriberWorking = false;
  isStopped = false;

  constructor(public config: ConfigOptions = {}) {
    console.log('new KaldiRTTranscriber');
    this.config = { ...new Config(), ...config };
    this.wsStatus = this.createStatusWebSocket();
    // this.init();
  }

  sendAudio(pcmData: Int16Array) {
    this.socketSend(pcmData);
  }

  stopAudio() {
    console.log('stopAudio');
    this.socketSend('EOS');
  }

  init() {
    this.ws = this.createWebSocket();
  }

  stopTranscription() {
    console.log('stopTranscription');
    this.socketSend('STOP_TRANSCRIPTION');
  }

  startTranscription(auto: boolean) {
    console.log('startTranscription');
    if (auto) {
      this.socketSend('START_TRANSCRIPTION_AUTO');
    } else {
      this.socketSend('START_TRANSCRIPTION');
    }
  }

  private createWebSocket(): WebSocket {
    const url = `${this.config.server}?${this.config.contentType}`;
    console.log('open url ' + url);

    const ws = new WebSocket(addAuth(url));
    const config = this.config;

    ws.onmessage = (e: WebSocketEvent) => {
      const data = e.data;
      config.onEvent?.(MSG_WEB_SOCKET, data);
      if (data instanceof Blob) {
        config.onError?.(ERR_SERVER, 'WebSocket: got Blob');
      } else if (typeof data === 'string') {
        try {
          const res = JSON.parse(data);
          if (res.status === 0) {
            if (res.event === TranscriptionEvent.START_TRANSCRIPTION) {
              console.debug('onStartTranscription', res);
              config.onStartTranscription?.(res['transcription-id']);
            } else if (res.event === TranscriptionEvent.STOP_TRANSCRIPTION) {
              config.onStopTranscription?.(true);
            } else if (res.event === TranscriptionEvent.STOPPING_TRANSCRIPTION) {
              config.onStopTranscription?.(false);
            } else if (res.event === TranscriptionEvent.TRANSCRIPTION) {
              if (res.result) {
                if (res.result.final) {
                  config.onResults?.(res);
                } else {
                  config.onPartialResults?.(res);
                }
              }
            } else {
              // other commands
              config.onCommand?.(res.event);
            }
          } else {
            config.onError?.(
              ERR_SERVER,
              'Server error: ' + res.status + ': ' + this.getDescription(res.status),
            );
          }
        } catch {
          config.onError?.(ERR_SERVER, 'Failed to parse server response');
        }
      } else {
        config.onError?.(ERR_SERVER, 'WebSocket: got unknown data type');
      }
    };

    ws.onopen = (_e: Event) => {
      console.debug('on open');
      config.onReadyForSpeech?.();
      config.onEvent?.(MSG_WEB_SOCKET_OPEN, 'Open event');
    };

    ws.onclose = (e) => {
      console.debug('on close');
      config.onEndOfSession?.();
      config.onEvent?.(MSG_WEB_SOCKET_CLOSE, `${e.code}/${e.reason}/${e.wasClean}`);
    };

    ws.onerror = (_e: Event) => {
      console.log('on error');
      config.onError?.(ERR_NETWORK, 'WebSocket connection error');
    };

    console.debug('exit ws create');
    return ws;
  }

  private getDescription(code: number): string {
    return SERVER_STATUS_CODE[code] || 'Unknown error';
  }

  private socketSend(item: Int16Array | string) {
    if (this.ws) {
      const state = this.ws.readyState;
      if (state === WebSocket.OPEN) {
        if (item instanceof Int16Array) {
          if (item.length > 0) {
            this.ws.send(item);
            this.config.onEvent?.(MSG_SEND, 'Send: blob: ' + item.length);
          } else {
            this.config.onEvent?.(MSG_SEND_EMPTY, 'Send: blob: EMPTY');
          }
        } else {
          this.ws.send(item);
          this.config.onEvent?.(MSG_SEND_EOS, 'Send tag: ' + item);
        }
      } else {
        this.config.onError?.(
          ERR_NETWORK,
          'WebSocket: readyState!=1: ' + state + ': failed to send: ' + item,
        );
      }
    } else {
      this.config.onError?.(ERR_CLIENT, 'No web socket connection: failed to send: ' + item);
    }
  }

  private createStatusWebSocket() {
    console.log(`createStatusWebSocket`);

    const wsUrl = addAuth(this.config.statusServer || '');

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (evt: WebSocketEvent) => {
      try {
        if (typeof evt.data !== 'string') {
          this.config.onServerStatus?.({ num_workers_available: 0 });
        } else {
          this.config.onServerStatus?.(JSON.parse(evt.data));
        }
      } catch (error: unknown) {
        console.error('WebSocket: status parse error', error);
        this.config.onServerStatus?.({ num_workers_available: 0 });
      }
    };

    ws.onopen = () => {
      this.statusReconnectInterval = 1000;
    };

    ws.onclose = () => {
      if (!this.isStopped) {
        setTimeout(() => this.createStatusWebSocket(), this.statusReconnectInterval);
        this.statusReconnectInterval = Math.min(this.statusReconnectInterval * 2, 30000);
        this.wsStatus = null;
      }
    };

    ws.onerror = (error) => {
      if (this.isStopped) {
        return;
      }
      console.error(`WebSocket (${this.isStopped}): status connection error `, error);
      this.config.onServerStatus?.({ num_workers_available: 0 });
    };
    return ws;
  }

  stop() {
    this.isStopped = true;
    if (this.ws) {
      console.debug('ws stop');
      this.ws.close();
      this.ws = null;
    }
    if (this.wsStatus) {
      console.debug('ws status stop');
      this.wsStatus.close();
      this.wsStatus = null;
    }
  }
}
