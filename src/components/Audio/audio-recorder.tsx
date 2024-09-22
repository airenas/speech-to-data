import { useAppContext } from '@/app-context/AppContext';
import useNotifications from '@/store/notifications';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { nanoid } from 'ai';
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import AudioResampler from './audio-resampler';
import PCM from './pcm-to-wav';
import { KaldiRTTranscriber } from './transcriber';

type AudioRecorderProps = {
    transcriberRef: React.MutableRefObject<KaldiRTTranscriber | null>;
};

const AudioRecorder = forwardRef<{ startRecording: () => void; stopRecording: () => void }, AudioRecorderProps>((props, ref) => {
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

    const theme = useTheme()
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { isRecording, setRecording, setAudio } = useAppContext()
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);

    const audioRef = useRef<any | null>(null);

    // const [transcriberReady] = useState(false);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationIdRef = useRef<number | null>(null);
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

                audioRef.current = [];
                let initialized = false
                workletNode.port.onmessage = (event) => {
                    console.log('event:', event);
                    if (event.data.type === 'audioData') {
                        const buffer = event.data.data;
                        if (buffer.length > 0) {
                            const pcmData = resampler.downsampleAndConvertToPCM(buffer);
                            audioRef.current.push(pcmData)
                            console.debug(`len orig: ${buffer.length}, downsampled: ${pcmData.length}`);
                            console.debug(`len audio: ${audioRef.current.length}`);
                            if (transcriberRef.current) {
                                if (transcriberRef.current.isTranscriberReady && transcriberRef.current.isTranscriberWorking) {
                                    transcriberRef.current.sendAudio(pcmData);
                                }
                            }
                            if (!transcriberRef.current?.isTranscriberReady && !initialized) {
                                console.log('Initializing transcriber...');
                                initialized = true
                                transcriberRef.current?.init()
                            }
                        }
                    }
                };
                setRecording(true);
                draw(canvasCtx, canvas);
            }
        } catch (error: any) {
            // const errStr = errorAsStr(error);
            // toast.error(`Nepavyko pradėti įrašinėti\n\n${errStr}`);
            console.error(error);
            showError(`Nepavyko pradėti įrašinėti\n\n${error.message}`);
            //todo  ws.sendAudioEvent(rec_id, false);
            stopRecording()
        }
    };

    useEffect(() => {
        console.log('init audio element');
        return () => {
            console.log('drop audio element');
            stopRecording();
        };
    }, []);

    const stopRecording = () => {
        console.debug(`stop ${rec_id}`);
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
        }
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect()
        };
        if (sourceRef.current) {
            sourceRef.current.disconnect()
        };
        if (isRecording) {
            transcriberRef.current?.stopAudio();
        }
        stopStream()
        setRecording(false);
        prepareAudio(audioRef.current);
        audioRef.current = null;
    };

    const prepareAudio = (audio: [[]] | null) => {
        console.log('prepareAudio');
        const startTime = performance.now()
        if (audio) {
            console.debug(`len audio: ${audio.length}`);
            const allPcmData = concat(audio)
            if (!allPcmData) {
                console.error('No audio data');
                return
            }
            const timeElapsed = performance.now() - startTime
            console.log(`prepareAudio3 time ${timeElapsed} ms`)
            const wav = new PCM(sampleRate).encodeWAV(allPcmData)
            const wavBlob = new Blob([wav], { type: 'audio/wav' })
            const blobUrl = URL.createObjectURL(wavBlob)
            setAudio(blobUrl)
        }
    };

    const concat = (arrays: [[]]) => {
        const totalLength = arrays.reduce((acc, value) => acc + value.length, 0)
        if (!arrays.length) {
            return null
        }
        const result = new Float32Array(totalLength)
        let length = 0
        for (const array of arrays) {
            result.set(array, length)
            length += array.length
        }
        return result
    }

    const stopStream = () => {
        if (streamRef.current) {
            console.debug(`drop stream`);
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
    };

    const draw = (canvasCtx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        animationIdRef.current = requestAnimationFrame(() => draw(canvasCtx, canvas));
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        drawForm(canvasCtx, canvas, dataArrayRef.current);
    };

    const drawForm = (canvasCtx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array) => {
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
        <div style={{
            display: isRecording ? 'block' : 'none'
        }}>
            <Button
                // variant="contained"
                onClick={stopRecording}
                style={{
                    position: 'relative', overflow: 'hidden', padding: 6, width: 80
                }}
                disabled={!isRecording}
            >
                <canvas ref={canvasRef}
                    style={{
                        background: 'red',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none', // Ensure clicks are captured by the button, not the canvas
                        opacity: 0.4,
                    }
                    } />
                {isRecording ? 'Stop' : 'Įrašyti'}
            </Button>
        </div>
    );
});

export default AudioRecorder;

