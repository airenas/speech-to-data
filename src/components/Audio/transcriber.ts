import { ConfigOptions, SpeechSegment, ServerStatusCode, WebSocketEvent } from './types';

// Server status codes
const SERVER_STATUS_CODE: ServerStatusCode = {
  0: 'Success',
  1: 'No speech',
  2: 'Aborted',
  9: 'No available'
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
  server = 'ws://localhost:8082/client/ws/speech';
  statusServer = 'ws://localhost:8082/client/ws/status';
  sampleRate = 16000;
  contentType = 'content-type=audio/x-raw,+layout=(string)interleaved,+rate=(int)16000,+format=(string)S16LE,+channels=(int)1';
  onError: (type: number, error: string) => void = (et, e) => { console.error(et, e); };
  onReadyForSpeech: () => void = () => { console.log('onReadyForSpeech'); };
  onEndOfSpeech: () => void = () => { console.log('onEndOfSpeech'); };
  onPartialResults: (data: any) => void = (data) => { console.log('onPartialResults ' + data); };
  onResults: (data: any) => void = (data) => { console.log('onResults ' + data); };
  onServerStatus: (data: any) => void = (data) => { console.log('onServerStatus ' + data); };
  onEndOfSession: () => void = () => { console.log('onEndOfSession'); };
  onEvent: (eventType: number, data: any) => void = (e, data) => { console.log('onEvent ' + e); };
  rafCallback: (time: number) => void = (time) => { console.log('rafCallback'); };
}

export class KaldiSpeechSegment implements SpeechSegment {
  constructor(
    public segment: number,
    public transcript: string,
    public final: boolean
  ) {}
}

export class KaldiRTTranscriber {
  private ws: WebSocket | null = null;
  statusReconnectInterval = 1000;

  constructor(public config: ConfigOptions = {}) {
    this.config = { ...new Config(), ...config };
    createStatusWebSocket(this);
    this.init();
  }

  sendAudio(pcmData: Blob) {
    this.socketSend(pcmData);
  }

  stopAudio() {
    console.log('stopAudio');
    this.socketSend('EOS');
  }

  init() {
    this.ws = this.createWebSocket();
  }

  private createWebSocket(): WebSocket {
    const url = `${this.config.server}?${this.config.contentType}`;
    console.log('open url ' + url);
    const ws = new WebSocket(url);
    const config = this.config;

    ws.onmessage = (e: WebSocketEvent) => {
      const data = e.data;
      config.onEvent?.(MSG_WEB_SOCKET, data);
      if (data instanceof Blob) {
        config.onError?.(ERR_SERVER, 'WebSocket: got Blob');
      } else {
        try {
          const res = JSON.parse(data);
          if (res.status === 0) {
            if (res.result) {
              if (res.result.final) {
                config.onResults?.(res);
              } else {
                config.onPartialResults?.(res);
              }
            }
          } else {
            config.onError?.(ERR_SERVER, 'Server error: ' + res.status + ': ' + this.getDescription(res.status));
          }
        } catch (err) {
          config.onError?.(ERR_SERVER, 'Failed to parse server response');
        }
      }
    };

    ws.onopen = (e) => {
      console.log('on open');
      config.onReadyForSpeech?.();
      config.onEvent?.(MSG_WEB_SOCKET_OPEN, e);
    };

    ws.onclose = (e) => {
      console.log('on close');
      config.onEndOfSession?.();
      config.onEvent?.(MSG_WEB_SOCKET_CLOSE, `${e.code}/${e.reason}/${e.wasClean}`);
    };

    ws.onerror = (e) => {
      console.log('on error');
      const data = (e as any).data;
      config.onError?.(ERR_NETWORK, data);
    };

    console.log('exit ws create');
    return ws;
  }

  private getDescription(code: number): string {
    return SERVER_STATUS_CODE[code] || 'Unknown error';
  }

  private socketSend(item: Blob | string) {
    if (this.ws) {
      const state = this.ws.readyState;
      if (state === WebSocket.OPEN) {
        if (item instanceof Blob) {
          if (item.size > 0) {
            this.ws.send(item);
            this.config.onEvent?.(MSG_SEND, 'Send: blob: ' + item.type + ', ' + item.size);
          } else {
            this.config.onEvent?.(MSG_SEND_EMPTY, 'Send: blob: ' + item.type + ', EMPTY');
          }
        } else {
          this.ws.send(item);
          this.config.onEvent?.(MSG_SEND_EOS, 'Send tag: ' + item);
        }
      } else {
        this.config.onError?.(ERR_NETWORK, 'WebSocket: readyState!=1: ' + state + ': failed to send: ' + item);
      }
    } else {
      this.config.onError?.(ERR_CLIENT, 'No web socket connection: failed to send: ' + item);
    }
  }

  stop() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

function createStatusWebSocket(self: KaldiRTTranscriber) {
  const ws = new WebSocket(self.config.statusServer || '');

  ws.onmessage = (evt: WebSocketEvent) => {
    try {
      self.config.onServerStatus?.(JSON.parse(evt.data));
    } catch {
      self.config.onServerStatus?.({ num_workers_available: 0 });
    }
  };

  ws.onopen = () => {
    self.statusReconnectInterval = 1000;
  };

  ws.onclose = () => {
    setTimeout(() => createStatusWebSocket(self), self.statusReconnectInterval);
    self.statusReconnectInterval = Math.min(self.statusReconnectInterval * 2, 30000);
  };

  ws.onerror = () => {
    self.config.onServerStatus?.({ num_workers_available: 0 });
  };
}