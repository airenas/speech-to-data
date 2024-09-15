import { useAppContext } from '@/app-context/AppContext';
import AudioRecorder from '@/components/Audio/audio-recorder';
import { Config, KaldiRTTranscriber } from '@/components/Audio/transcriber';
import ClearButton from '@/components/clear-button';
import Meta from '@/components/Meta';
import { FullSizeCenteredFlexBox } from '@/components/styled';
import useNotifications from '@/store/notifications';
import { Box, Button, Checkbox, FormControlLabel, TextField } from '@mui/material';
import { useEffect, useRef } from 'react';


function Transcriber() {
  const [, notificationsActions] = useNotifications();
  const transcriberRef = useRef<KaldiRTTranscriber | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);

  const { lists, setLists, nextId, setNextId, workers, setWorkers, isRecording } = useAppContext();

  const start = () => {
    setLists([...lists, { id: nextId, content: '', selected: false }]);
    setNextId(nextId + 1);
    console.log('Starting recording', audioRecorderRef.current);
    if (audioRecorderRef.current) {
      audioRecorderRef.current.startRecording();
    }
  };

  const clear = () => {
    setLists([{ id: nextId, content: '', selected: false }]);
    setNextId(nextId + 1);
  };

  const selectAll = () => {
    setLists(lists.map(list => ({ ...list, selected: true })));
  };

  // Function to remove a list
  const removeList = (id: number) => {
    setLists(lists.filter(list => list.id !== id));
  };

  // Function to update the content of a list
  const updateListContent = (id: number, newContent: string) => {
    setLists(
      lists.map(list =>
        list.id === id ? { ...list, content: newContent } : list
      )
    );
  };

  const initTranscriber = (): KaldiRTTranscriber => {

    const cfg = new Config();
    cfg.onPartialResults = (data: any) => {
      console.log('onPartialResults');
      const transcript = data.result.hypotheses;
      // if (transcript) {
      //   const text = transcript[0].transcript;
      //   pageData.partials = text;
      // }
      // updateSegments(pageData, data['old-updates']);
      // updateRes(pageData);
    };

    cfg.onResults = (data: any) => {
      console.debug('onResults');
      const transcript = data.result.hypotheses;
      // if (transcript) {
      //   const text = transcript[0].transcript;
      //   addSegment(pageData, text, data.segment);
      //   pageData.partials = '';
      // }
      // updateSegments(pageData, data['old-updates']);
      // updateRes(pageData);
    };

    cfg.onEvent = (e: any, data: any) => {
      // Add logging or event-handling logic
    };

    cfg.onServerStatus = (data: any) => {
      setWorkers(data.num_workers_available);
      console.log('onStatusEvent ' + workers);
    };

    cfg.onReadyForSpeech = () => {
      // pageData.transcriberReady = true;
      // pageData.transcriberWorking = true;
      // addMsg(false, 'Ready for speech');
    };

    cfg.onEndOfSpeech = () => {
      // pageData.transcriberReady = false;
      // pageData.transcriberWorking = false;
      // addMsg(false, 'Stop speech');
      // stop(pageData);
    };

    cfg.onEndOfSession = () => {
      // pageData.transcriberReady = false;
      // pageData.transcriberWorking = false;
      // addMsg(false, 'Stop speech session');
      // stop(pageData);
    };

    cfg.onError = (et: number, data: any) => {
      // pageData.transcriberReady = false;
      // pageData.transcriberWorking = false;
      // addMsg(true, `Error ${et}`);
      // stop(pageData);
    };

    return new KaldiRTTranscriber(cfg);

  }

  useEffect(() => {
    console.log('Starting transcriber');
    const transcriber = initTranscriber();
    transcriberRef.current = transcriber;
    return () => {
      console.log('Stopping transcriber');
      if (transcriberRef.current) {
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
      <Meta title="siųsti failą" />
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
            {lists.map(list => (
              <div key={list.id} style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                <TextField
                  multiline
                  fullWidth
                  value={list.content}
                  onChange={(e) => updateListContent(list.id, e.target.value)}
                  variant="outlined"
                  maxRows={Infinity}
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
                />
              </div>
            ))}
          </div>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '10px' }}>
            <ClearButton
              onClear={clear}
              disabled={!(isAnyTextPresent || lists.length > 1)}
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

            <AudioRecorder ref={audioRecorderRef} />

            <Button variant="contained" color="primary" disabled={!isAnySelectedText} onClick={copyToClipboard}>
              Kopijuoti
            </Button>
            <Button variant="contained" color="primary" disabled={!isAnyNotSelected} onClick={selectAll}>
              Pažymėti visus
            </Button>
          </Box>
        </Box>
      </FullSizeCenteredFlexBox>
    </>
  );
}

export default Transcriber;
function mapErr(errorText: string): string {
  if (errorText === 'audio expected') {
    return 'Blogas failas - ne audio failas';
  }
  return errorText;
}
