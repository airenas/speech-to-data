import { TranscriptionView, useAppContext } from '@/app-context/AppContext';
import AudioRecorder from '@/components/Audio/audio-recorder';
import { Config, KaldiRTTranscriber } from '@/components/Audio/transcriber';
import ClearButton from '@/components/clear-button';
import Meta from '@/components/Meta';
import { FullSizeCenteredFlexBox } from '@/components/styled';
import useNotifications from '@/store/notifications';
import { TranscriptionResult } from '@/utils/transcription-result';
import { Box, Button, Checkbox, FormControlLabel, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';





function Transcriber() {
  const [, notificationsActions] = useNotifications();
  const transcriberRef = useRef<KaldiRTTranscriber | null>(null);
  const lastTranscriptionRef = useRef<TranscriptionResult>(new TranscriptionResult());
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);
  const [scrollBottom, setScrollBottom] = useState<boolean>(false);


  const { lists, setLists, nextId, setNextId, workers, setWorkers, isRecording, isWorking, setWorking } = useAppContext();

  const start = () => {
    setScrollBottom(true);
    if (!lastEmpty()) {
      setLists([...lists, { id: nextId, content: '', selected: false, audioUrl: null }]);
      setNextId(nextId + 1);
    }
    console.log('Starting recording', audioRecorderRef.current);
    lastTranscriptionRef.current = new TranscriptionResult();
    if (audioRecorderRef.current) {
      audioRecorderRef.current.startRecording();
    }
  };

  const stop = () => {
    console.log('Stoping recording', audioRecorderRef.current);
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stopRecording();
    }
  };

  const clear = () => {
    setLists([{ id: nextId, content: '', selected: false, audioUrl: null }]);
    setNextId(nextId + 1);
  };

  const selectAll = () => {
    setLists(lists.map(list => ({ ...list, selected: true })));
  };

  const updateListContent = (id: number, newContent: string) => {
    setLists(
      lists.map(list =>
        list.id === id ? { ...list, content: newContent } : list
      )
    );
  };

  const onFocus = (index: number, item: TranscriptionView) => {
    console.log('onFocus', index, item);
    setAudioUrl(item.audioUrl);
    if (lists.length - 1 > index) {
      setScrollBottom(false);
    } else {
      console.log('Setting scroll bottom');
      setScrollBottom(true);
    }
  };

  const lastEmpty = (): boolean => {
    if (lists.length === 0) {
      return false;
    }
    const lastItem = lists[lists.length - 1];
    return lastItem.content.trim() === '';
  };

  const updateRes = () => {
    const text = lastTranscriptionRef.current.getFullTranscription();

    setLists((prevLists) => {
      if (prevLists.length === 0) return prevLists;

      const updatedLists = [...prevLists];
      const lastItemIndex = updatedLists.length - 1;

      updatedLists[lastItemIndex] = {
        ...updatedLists[lastItemIndex],
        content: text,
      };
      return updatedLists;
    });
  };

  const initTranscriber = (): KaldiRTTranscriber => {
    console.log('initTranscriber');

    const cfg = new Config();
    cfg.onPartialResults = (data: any) => {
      console.log('onPartialResults');
      const transcript = data.result.hypotheses;
      console.log('transcript', transcript);
      if (transcript) {
        const text = transcript[0].transcript;
        lastTranscriptionRef.current.updatePartial(text);
      }
      lastTranscriptionRef.current.updateSegments(data['old-updates']);
      updateRes();
    };

    cfg.onResults = (data: any) => {
      console.debug('onResults');
      const transcript = data.result.hypotheses;
      console.log('transcript', transcript);
      if (transcript) {
        const text = transcript[0].transcript;
        lastTranscriptionRef.current.addSegment(text, data.segment);
        lastTranscriptionRef.current.updatePartial('');
      }
      lastTranscriptionRef.current.updateSegments(data['old-updates']);
      updateRes();
    };

    cfg.onEvent = (e: any, data: any) => {
      console.log('onEvent ' + e);
    };

    cfg.onServerStatus = (data: any) => {
      setWorkers(data.num_workers_available);
      console.log('onStatusEvent ' + workers);
    };

    cfg.onReadyForSpeech = () => {
      console.log('onReadyForSpeech', transcriberRef.current);
      if (!transcriberRef.current) return;
      transcriberRef.current.isTranscriberReady = true;
      transcriberRef.current.isTranscriberWorking = true;
      setWorking(true);
      console.log('onReadyForSpeech end', transcriberRef.current);
    };

    cfg.onEndOfSpeech = () => {
      console.log('onEndOfSpeech', transcriberRef.current);
      if (!transcriberRef.current) return;
      transcriberRef.current.isTranscriberReady = false;
      transcriberRef.current.isTranscriberWorking = false;
      setWorking(false);
      stop();
    };

    cfg.onEndOfSession = () => {
      console.log('onEndOfSession', transcriberRef.current);
      if (!transcriberRef.current) return;
      transcriberRef.current.isTranscriberReady = false;
      transcriberRef.current.isTranscriberWorking = false;
      setWorking(false);
      stop();
    };

    cfg.onError = (et: number, data: any) => {
      console.log('onError', transcriberRef.current, et, data); ``
      if (!transcriberRef.current) return;
      transcriberRef.current.isTranscriberReady = false;
      transcriberRef.current.isTranscriberWorking = false;
      setWorking(false);
      stop();
    };

    return new KaldiRTTranscriber(cfg);

  }

  const selectedItem = lists.find(list => list.selected);

  useEffect(() => {
    console.log('Selected audio URL changed to:', audioUrl);
    if (audioUrl && audioRef.current) {
      console.log('Selected audio URL changed to:', audioUrl);
      audioRef.current.load();
    }
  }, [audioUrl]);

  useEffect(() => {
    console.log('Lists updated:', lists, scrollBottom, lastItemRef.current);
    if (lastItemRef.current && scrollBottom) {
      lastItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      // setScrollBottom(false);
    }
  }, [lists]);

  useEffect(() => {
    console.log('Starting transcriber');
    const transcriber = initTranscriber();
    transcriberRef.current = transcriber;
    return () => {
      console.log('Exit');
      if (audioRecorderRef.current) {
        console.log('Stopping recorder');
        audioRecorderRef.current.stopRecording();
      }
      if (transcriberRef.current) {
        console.log('Stopping transcriber');
        transcriberRef.current.stop();
      }
    };
  }, []);

  function showError(msg: string) {
    notificationsActions.push({
      options: {
        variant: 'errorNotification',
      },
      message: msg,
    });
  }

  function showInfo(msg: string) {
    notificationsActions.push({
      options: {
        variant: 'infoNotification',
      },
      message: msg,
    });
  }

  const isAnyNotSelected = lists.some(list => !list.selected);

  const copyToClipboard = () => {
    const allText = lists.filter(list => list.selected).map(list => list.content).join('\n');

    navigator.clipboard.writeText(allText)
      .then(() => {
        showInfo('Nukopijuota');
      })
      .catch(err => {
        showError('Nepavyko nukopijuoti');
        console.error('Failed to copy: ', err);
      });
  };


  const toggleSelect = (id: number) => {
    setLists(lists.map(list => (list.id === id ? { ...list, selected: !list.selected } : list)));
  };

  const isAnyTextPresent = lists.some(list => list.content.trim() !== '');

  const isAnySelectedText = lists.filter(list => list.selected).some(list => list.content.trim() !== '');

  return (
    <>
      <Meta title="transkribatotius" />
      <FullSizeCenteredFlexBox>
        <Box
          component="form"
          noValidate
          sx={{
            width: '100%',
            maxWidth: '700px',
            display: 'flex',
            flexDirection: 'column',
            height: '90vh'
          }}
        >

          <div style={{
            padding: '10px',

            flex: 1, // Allow this div to grow and shrink as needed
            overflowY: 'auto', // Enable vertical scrolling
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginBottom: '10px', // Space between text areas and buttons
          }}
          >
            <audio controls ref={audioRef} >
              <source
                src={audioUrl || ""}
                type="audio/wav"
              />
              Your browser does not support the audio element.
            </audio>
            {lists.map((list, index) => (
              <div key={list.id}
                style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                <TextField
                  multiline
                  fullWidth
                  value={list.content}
                  onChange={(e) => updateListContent(list.id, e.target.value)}
                  variant="outlined"
                  maxRows={Infinity}
                  onFocus={() => {
                    onFocus(index, list);
                  }}
                  ref={index === lists.length - 1 ? lastItemRef : null}
                  InputProps={{
                    readOnly: (isRecording || isWorking) && index === lists.length - 1,
                    style: {
                      opacity: (isRecording || isWorking) && index === lists.length - 1 ? 0.7 : 1,
                    },
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={list.selected}
                      onChange={() => toggleSelect(list.id)}
                      color="primary"
                    />
                  }
                  label="" // No label next to the checkbox
                  sx={{ marginLeft: '10px' }}
                  disabled={isRecording && index === lists.length - 1}
                />
              </div>
            ))}
          </div>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '10px' }}>
            <ClearButton
              onClear={clear}
              disabled={!(isAnyTextPresent || lists.length > 1) || isRecording}
            />

            <Button variant="contained"
              color="primary"
              onClick={start}
              disabled={workers === 0}
              style={{ display: isRecording ? 'none' : 'block' }}
              className={isRecording ? 'hidden' : ''}
            >
              Įrašyti&nbsp;<span style={{ fontSize: '0.8em', fontStyle: 'italic' }}>({workers})</span>
            </Button>

            <AudioRecorder ref={audioRecorderRef} transcriberRef={transcriberRef} />

            <Button variant="contained" color="primary" disabled={!isAnySelectedText || isRecording} onClick={copyToClipboard}>
              Kopijuoti
            </Button>
            <Button variant="contained" color="primary" disabled={!isAnyNotSelected || isRecording} onClick={selectAll}>
              Pažymėti visus
            </Button>
          </Box>
        </Box>
      </FullSizeCenteredFlexBox>
    </>
  );
}

export default Transcriber;
