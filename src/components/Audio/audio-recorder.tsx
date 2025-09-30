import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { nanoid } from 'ai';

import { useAppContext } from '@/app-context/AppContext';
import { TranscriberStatus } from '@/app-context/types';
import useNotifications from '@/store/notifications';

import AudioResampler from './audio-resampler';
import { KaldiRTTranscriber } from './transcriber';

type AudioRecorderProps = {
  transcriberRef: React.MutableRefObject<KaldiRTTranscriber | null>;
};

const AudioRecorder = forwardRef<
  { startRecording: () => void; stopRecording: () => void },
  AudioRecorderProps
>((props, ref) => {
  const internalRef = useRef(null);

  const [, notificationsActions] = useNotifications();
  const transcriberRef = props.transcriberRef;

  useImperativeHandle(ref, () => ({
    startRecording: () => {
      console.log('Start recording...');
      startRecording();
    },
    stopRecording: () => {
      console.log('Stop recording...');
      stopRecording();
    },
  }));

  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isRecording, setRecording, transcriberStatus, isAuto, setTranscriberStatus } =
    useAppContext();
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  // const [transcriberReady] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isStoppedRef = useRef<boolean>(false);

  const sampleRate = 16000;
  // const ws = getWS();
  let rec_id = nanoid();

  function showError(msg: string) {
    notificationsActions.push({
      options: {
        variant: 'errorNotification',
      },
      message: msg,
    });
  }

  const startRecording = async () => {
    rec_id = nanoid();
    console.log(`start recording ${rec_id}`);
    isStoppedRef.current = false;
    if (streamRef.current) {
      console.warn('Already recording!!!!!');
      stopRecording();
    }
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;

      if (!streamRef.current) {
        const constraints = {
          audio: {
            channelCount: 1,
            sampleRate: sampleRate,
            sampleSize: 16,
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true,
          },
          video: false,
        };
        streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      }
      const stream = streamRef.current;
      if (!canvasRef.current) {
        throw new Error('Canvas not found');
      }

      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) {
        throw new Error('Canvas context not found');
      }

      if (audioContext && stream) {
        console.debug(`create source`);
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        if (!analyserRef.current) {
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 256;
        }
        const analyser = analyserRef.current;
        if (!dataArrayRef.current) {
          const bufferLength = analyser.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
        }
        source.connect(analyser);

        const baseUrl = import.meta.env.VITE_ENV_BASE_PATH || '/__BASE_PATH__/';
        console.log('baseUrl:', baseUrl);
        await audioContext.audioWorklet.addModule(`${baseUrl}/audio-processor.js`);
        const workletNode = new AudioWorkletNode(audioContext, 'recorder-audio-processor', {
          processorOptions: {
            sampleRate: audioContext.sampleRate,
            bufferInSec: 0.25,
          },
        });
        workletNodeRef.current = workletNode;
        // todo ws.sendAudioEvent(rec_id, true);
        source.connect(workletNode);
        const resampler = new AudioResampler(audioContext.sampleRate, 16000); // Assuming cfg.sampleRate is 16000

        let initialized = false;
        workletNode.port.onmessage = (event) => {
          // console.log('event:', event);
          if (event.data.type === 'audioData') {
            const buffer = event.data.data;
            if (buffer.length > 0) {
              const pcmData = resampler.downsampleAndConvertToPCM(buffer);
              if (transcriberRef.current) {
                if (
                  transcriberRef.current.isTranscriberReady &&
                  transcriberRef.current.isTranscriberWorking
                ) {
                  transcriberRef.current.sendAudio(pcmData);
                }
              }
              if (!transcriberRef.current?.isTranscriberReady && !initialized) {
                initialized = true;
                transcriberRef.current?.init();
              }
            }
          }
        };
        setRecording(true);
        draw(canvasCtx, canvas);
      }
    } catch (error: any) {
      console.error(error);
      showError(`Nepavyko pradėti įrašinėti\n\n${error.message}`);
      stopRecording();
    }
  };

  useEffect(() => {
    console.log('init audio element');
    return () => {
      console.log('drop audio element');
      stopRecording();
    };
  }, []);

  const startStopRecording = () => {
    if (transcriberStatus === TranscriberStatus.TRANSCRIBING) {
      if (isAuto) {
        transcriberRef.current?.stopTranscription();
        setTranscriberStatus(TranscriberStatus.STOPPING);
      } else {
        stopRecording();
      }
    } else if (transcriberStatus === TranscriberStatus.LISTENING) {
      transcriberRef.current?.startTranscription(isAuto);
    }
  };

  const stopRecording = () => {
    console.log(`stopped ${isStoppedRef.current}`);
    if (isStoppedRef.current) {
      return;
    }
    isStoppedRef.current = true;
    console.log(`stopped ${isStoppedRef.current}`);
    console.debug(`stop ${rec_id}`);
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (isRecording) {
      setTranscriberStatus(TranscriberStatus.STOPPING);
      try {
        transcriberRef.current?.stopAudio();
      } catch (error: any) {
        console.error(error);
      }
    }
    stopStream();
    setRecording(false);
  };

  const stopStream = () => {
    if (streamRef.current) {
      console.debug(`drop stream`);
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const draw = (canvasCtx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    animationIdRef.current = requestAnimationFrame(() => draw(canvasCtx, canvas));
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    drawForm(canvasCtx, canvas, dataArrayRef.current);
  };

  const drawForm = (
    canvasCtx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    dataArray: Uint8Array,
  ) => {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / dataArray.length) * 2;
    let barHeight;
    let x = 0;

    canvasCtx.fillStyle = theme.palette.background.paper;
    for (let i = 0; i < dataArray.length; i++) {
      barHeight = dataArray[i];
      canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
      x += barWidth + 1;
    }
  };

  return (
    <div
      style={{
        display: isRecording ? 'block' : 'none',
      }}
    >
      <Button
        // variant="contained"
        onClick={startStopRecording}
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 6,
          width: 100,
          color: theme.palette.getContrastText(theme.palette.background.paper),
        }}
        disabled={!isRecording}
      >
        <canvas
          ref={canvasRef}
          style={{
            background: transcriberStatus === TranscriberStatus.TRANSCRIBING ? 'red' : 'yellow',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // Ensure clicks are captured by the button, not the canvas
            opacity: 0.4,
          }}
        />
        {transcriberStatus === TranscriberStatus.TRANSCRIBING ? 'Stop' : 'Įrašyti'}
      </Button>
    </div>
  );
});

export default AudioRecorder;
