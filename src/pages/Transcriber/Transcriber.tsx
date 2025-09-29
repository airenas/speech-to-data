import { TranscriberStatus, TranscriptionView, useAppContext } from '@/app-context/AppContext';
import AudioRecorder from '@/components/Audio/audio-recorder';
import { Config, KaldiRTTranscriber } from '@/components/Audio/transcriber';
import { TranscriptionEvent } from '@/components/Audio/types';
import ClearButton from '@/components/clear-button';
import Meta from '@/components/Meta';
import { FullSizeCenteredFlexBox } from '@/components/styled';
import { audioUrl, makeLink } from '@/config';
import configService from '@/services/configService';
import startSound from "@/sounds/start.mp3";
import stopSound from "@/sounds/stop.mp3";
import useNotifications from '@/store/notifications';
import { TranscriptionResult } from '@/utils/transcription-result';
import { Box, Button, Checkbox, FormControlLabel, Switch, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';
import Joyride from 'react-joyride';
import { useNavigate } from 'react-router-dom';


function Transcriber() {
  const navigate = useNavigate();
  const [, notificationsActions] = useNotifications();
  const transcriberRef = useRef<KaldiRTTranscriber | null>(null);
  const lastTranscriptionRef = useRef<TranscriptionResult>(new TranscriptionResult());
  const audioRecorderRef = useRef<{ startRecording: () => void; stopRecording: () => void } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);
  const [scrollBottom, setScrollBottom] = useState<boolean>(false);
  const firstRender = useRef(true);
  const theme = useTheme();

  const startAudioRef = useRef<HTMLAudioElement | null>(null);
  const stopAudioRef = useRef<HTMLAudioElement | null>(null);

  const { lists, setLists, workers, setWorkers, isRecording, transcriberStatus, setTranscriberStatus, user, showError, showInfo, clearList, isAuto, setAuto, selectLast } = useAppContext();
  const isAutoRef = useRef(isAuto);
  const transcriberStatusRef = useRef(transcriberStatus);
  const listsRef = useRef<TranscriptionView[]>(lists);

  const start = () => {
    setScrollBottom(true);
    console.log('Starting recording', audioRecorderRef.current);
    if (audioRecorderRef.current) {
      audioRecorderRef.current.startRecording();
    }
  };

  const startStopAuto = (checked: boolean) => {
    console.log('Toggling auto to', checked);
    setAuto(checked);
  };

  const stop = () => {
    console.log('Stoping recording', audioRecorderRef.current);
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stopRecording();
    }
  };

  const clear = () => {
    clearList();
    setAudioFileUrl(null);
  };

  const selectAll = () => {
    const listCopy = listsRef.current;
    setLists(listCopy.map(list => ({ ...list, selected: true })));
  };

  const updateListContent = (id: string, newContent: string) => {
    setLists(
      lists.map(list =>
        list.id === id ? { ...list, content: newContent } : list
      )
    );
  };

  useEffect(() => {
    isAutoRef.current = isAuto;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    console.log('isAuto changed', isAuto);

    if (isAuto) {
      start();
    } else {
      if (transcriberStatusRef.current === TranscriberStatus.LISTENING) {
        stop();
      }
    }
  }, [isAuto]);

  const updateAudio = (audioUrl: string) => {
    console.log('updateAudio', audioUrl, transcriberStatus);
    if (transcriberStatusRef.current === TranscriberStatus.IDLE) {
      setAudioFileUrl(audioUrl);
    } else {
      setAudioFileUrl(null);
    }
  };

  const onFocus = (index: number, item: TranscriptionView) => {
    console.log('onFocus', index, item);
    let audioFileUrl = `${audioUrl}/${item.id}`;
    console.log('Setting audio URL to', audioUrl);
    updateAudio(audioFileUrl);
    if (lists.length - 1 > index) {
      setScrollBottom(false);
    } else {
      console.log('Setting scroll bottom');
      setScrollBottom(true);
    }
  };

  const startTrancriptionCapture = (id: string) => {
    setTranscriberStatus(TranscriberStatus.TRANSCRIBING);
    console.debug('list len=', listsRef.current.length);
    const newLists = [...listsRef.current];
    if (!lastEmpty()) {
      console.debug('non empty');
      console.debug('list len=', listsRef.current.length);
    } else {
      newLists.pop();
      console.debug('empty');
    }
    setLists([...newLists, { id: id, content: '', selected: false }]);

    console.log('Starting recording', audioRecorderRef.current);
    lastTranscriptionRef.current = new TranscriptionResult();
  };

  const lastEmpty = (): boolean => {
    if (listsRef.current.length === 0) {
      return false;
    }
    const lastItem = listsRef.current[listsRef.current.length - 1];
    return lastItem.content.trim() === '';
  };

  const updateRes = () => {
    const text = lastTranscriptionRef.current.getFullTranscription();

    console.log('transcriberStatus', transcriberStatusRef.current);
    if (transcriberStatusRef.current !== TranscriberStatus.TRANSCRIBING && transcriberStatusRef.current !== TranscriberStatus.STOPPING) {
      return;
    }

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
    console.debug('initTranscriber');

    const cfg = new Config();
    cfg.onPartialResults = (data: any) => {
      console.debug('onPartialResults', data);
      const transcript = data.result.hypotheses;
      // console.log('transcript', transcript);
      if (transcript) {
        const text = transcript[0].transcript;
        lastTranscriptionRef.current.updatePartial(text);
      }
      lastTranscriptionRef.current.updateSegments(data['old-updates']);
      updateRes();
    };

    cfg.onResults = (data: any) => {
      console.debug('onResults', data);
      const transcript = data.result.hypotheses;
      // console.log('transcript', transcript);
      if (transcript) {
        const text = transcript[0].transcript;
        lastTranscriptionRef.current.addSegment(text, data.segment);
        lastTranscriptionRef.current.updatePartial('');
      }
      lastTranscriptionRef.current.updateSegments(data['old-updates']);
      updateRes();
    };

    cfg.onEvent = (e: any, data: any) => {
      // console.log('onEvent ' + e);
    };

    cfg.onServerStatus = (data: any) => {
      setWorkers(data.num_workers_available);
      console.debug('onStatusEvent ' + workers);
    };

    cfg.onReadyForSpeech = () => {
      if (!transcriberRef.current) {
        return;
      }
      transcriberRef.current.isTranscriberReady = true;
      transcriberRef.current.isTranscriberWorking = true;
      console.debug('onReadyForSpeech isAuto=', isAutoRef.current);
      setTranscriberStatus(TranscriberStatus.LISTENING);
      if (!isAutoRef.current) {
        transcriberRef.current?.startTranscription(false);
      }
    };

    cfg.onStartTranscription = (id: string) => {
      console.debug('onStartTranscription', id);
      if (!transcriberRef.current) {
        return;
      }
      startTrancriptionCapture(id);
    };

    cfg.onStopTranscription = (final: boolean) => {
      if (!transcriberRef.current) {
        return;
      }
      console.debug('onStopTranscription', final);
      if (final) {
        console.debug('Stop transcription');
        if (!isAutoRef.current) {
          setTranscriberStatus(TranscriberStatus.IDLE);
        }
        setTranscriberStatus(TranscriberStatus.LISTENING);
        selectLast();
      } else {
        console.debug('Stopping transcription');
        setTranscriberStatus(TranscriberStatus.STOPPING);
      }
    };

    cfg.onEndOfSpeech = () => {
      if (!transcriberRef.current) {
        return;
      }
      console.debug('onEndOfSpeech');
      transcriberRef.current.isTranscriberReady = false;
      transcriberRef.current.isTranscriberWorking = false;
      stop();
      setTranscriberStatus(TranscriberStatus.IDLE);
      setAuto(false);
      selectLast();
    };

    cfg.onEndOfSession = () => {
      if (!transcriberRef.current) {
        return;
      }
      console.debug('onEndOfSession');
      transcriberRef.current.isTranscriberReady = false;
      transcriberRef.current.isTranscriberWorking = false;
      stop();
      setTranscriberStatus(TranscriberStatus.IDLE);
      setAuto(false);
      selectLast();
    };

    cfg.onError = (et: number, data: any) => {
      console.log('onError', et, data);
      showError("Atpažintubo klaida");
      if (!transcriberRef.current) {
        return;
      }
      transcriberRef.current.isTranscriberReady = false;
      transcriberRef.current.isTranscriberWorking = false;
      stop();
      setTranscriberStatus(TranscriberStatus.IDLE);
      setAuto(false);
      selectLast();
    };
    cfg.onCommand = (command: string) => {
      console.log('onCommand', command);
      if (command === TranscriptionEvent.STOP_LISTENING_COMMAND) {
        startStopAuto(false);
        showInfo('Sustabdyta');
      } else if (command === TranscriptionEvent.SELECT_ALL_COMMAND) {
        selectAll();
        showInfo('Pažymėta');
      } else if (command === TranscriptionEvent.COPY_COMMAND) {
        copyToClipboard();
      } else {
        console.error('Unknown command: ' + command);
      }
    };

    return new KaldiRTTranscriber(cfg);

  }

  const selectedItem = lists.find(list => list.selected);

  useEffect(() => {
    if (!user) {
      navigate(makeLink('/login'));
    }
    if (!user?.skipTour) {
      setRunTour(true);
    }
  }, [user]);

  useEffect(() => {
    // console.log('Selected audio URL changed to:', audioUrl);
    console.debug('Selected audio URL changed to:', audioUrl);
    if (audioUrl && audioRef.current) {
      console.debug('reloading:', audioUrl);
      audioRef.current.load();
    } else {
      console.debug('skip audio URL load');
    }
  }, [audioUrl]);

  useEffect(() => {
    const prev = transcriberStatusRef.current;
    transcriberStatusRef.current = transcriberStatus;
    if (transcriberStatus === TranscriberStatus.TRANSCRIBING) {
      startAudioRef.current?.play();
    }
    if (prev === TranscriberStatus.TRANSCRIBING &&
      (transcriberStatus === TranscriberStatus.IDLE || transcriberStatus === TranscriberStatus.LISTENING || transcriberStatus === TranscriberStatus.STOPPING)) {
      stopAudioRef.current?.play();
    }
    if (transcriberStatus !== TranscriberStatus.IDLE) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setAudioFileUrl("");
    }
  }, [transcriberStatus]);

  useEffect(() => {
    listsRef.current = lists;
    console.log('Lists updated:', lists, scrollBottom, lastItemRef.current);
    if (lastItemRef.current && scrollBottom) {
      lastItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      // setScrollBottom(false);
    }
  }, [lists]);

  useEffect(() => {
    console.debug('Starting transcriber');
    const transcriber = initTranscriber();
    transcriberRef.current = transcriber;
    return () => {
      console.debug('exit');
      if (audioRecorderRef.current) {
        console.debug('Stopping recorder');
        audioRecorderRef.current.stopRecording();
      }
      if (transcriberRef.current) {
        console.debug('Stopping transcriber');
        transcriberRef.current.stop();
      }
    };
  }, []);

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


  const toggleSelect = (id: string) => {
    setLists(lists.map(list => (list.id === id ? { ...list, selected: !list.selected } : list)));
  };

  const isAnyTextPresent = lists.some(list => list.content.trim() !== '');

  const isAnySelectedText = lists.filter(list => list.selected).some(list => list.content.trim() !== '');

  const [runTour, setRunTour] = useState(false);

  const introSteps = [
    { target: "#record-button", content: "Spauskite čia, kad pradėtumėte arba sustabdytumėte įrašymą. Skliausteliuose esantis skaičius rodo laisvas įrašymo sesijas. Jei nėra laisvų sesijų, irašyti negalėsite" },
    { target: "#transcription-area", content: "Diktavimo rezultatai. Tekstus taip pat galite redaguoti." },
    { target: "#audio-player", content: "Galite perklausyti diktavimo sesiją, kiekvienam laukeliui atskirai" },
    { target: "#auto-button", content: "Automatinis valdymas balsu. Įjungia klausymo režimą. Sistema klausosi mikrofono ir pradeda įrašymą ištarus komandą \"pradėk rašyti\". Baigia įrašymą ištarus komandą \"baik rašyti\". Sustabdo klausymo režimą ištarus komandą \"baik klaysyti\"." },
    { target: "#select-all-button", content: "Pažymi visus laukelius" },
    { target: "#copy-button", content: "Nukopijuoja pažymėtų laukelių tekstą į iškarpinę" },
    { target: "#clear-button", content: "Ištrina visus diktavimo rezultatus. Paspaudus turite 5s atšaukti ištrynimo komandą" },
    {
      target: "#logout-button", content: (
        <span>
          Atsijungia nuo sistemos. <strong>Jei netyčia uždarėte langą ar atsijungėte nuo sistemos, nenusikopijavę transkribuoto teksto</strong> - nepergyvenkite, sistema atsimena paskutinius Jūsų įrašus 6h (arba kol neišvalote diktavimo lango). Tiesiog prisijunkite iš naujo.
        </span>
      )
    },
  ];

  const overlayColor = theme.palette.mode === 'dark'
    ? "rgba(0, 0, 0, 0.7)"
    : "rgba(0, 0, 0, 0.3)";

  function tourStatusChanged(status: string) {
    console.log('tourStatusChanged', status);
    if (status === 'finished' || status === 'skipped') {
      (
        async () => {
          ``
          try {
            await configService.save({ skipTour: true });
            console.log("skip tour saved");
          } catch (e) {
            console.error(e)
          }
        }
      )();
      if (user) {
        user.skipTour = true;
      }
    }
  }

  return (
    <>
      <Meta title="transkribatorius" />
      <FullSizeCenteredFlexBox>
        <Box
          component="form"
          noValidate
          sx={{
            width: '100%',
            maxWidth: '1400px',
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
            id="transcription-area"
          >
            <audio controls ref={audioRef} src={audioFileUrl || ""}
              style={{ opacity: (transcriberStatus === TranscriberStatus.IDLE ? 1 : 0.5) }}
              id="audio-player"
            >
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
                    readOnly: (transcriberStatus === TranscriberStatus.TRANSCRIBING || transcriberStatus === TranscriberStatus.STOPPING) && index === lists.length - 1,
                    style: {
                      // backgroundColor: transcriberStatus === TranscriberStatus.TRANSCRIBING && index === lists.length - 1 ? 'red' : 'inherit',
                      opacity: (transcriberStatus === TranscriberStatus.TRANSCRIBING || transcriberStatus === TranscriberStatus.STOPPING) && index === lists.length - 1 ? 0.7 : 1,
                      border:
                        transcriberStatus === TranscriberStatus.TRANSCRIBING &&
                          index === lists.length - 1
                          ? "5px solid red"
                          : undefined,
                      animation:
                        transcriberStatus === TranscriberStatus.TRANSCRIBING &&
                          index === lists.length - 1
                          ? "waveBorder 1.5s ease-in-out infinite"
                          : "none",
                      borderRadius: "5px", // makes it look smoother
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
                  disabled={(transcriberStatus === TranscriberStatus.TRANSCRIBING || transcriberStatus === TranscriberStatus.STOPPING) && index === lists.length - 1}
                />
              </div>
            ))}
          </div>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '10px', width: '700px' }}>
              <ClearButton
                onClear={clear}
                disabled={!(isAnyTextPresent || lists.length > 1) || isRecording}
              />

              <FormControlLabel
                value="end"
                control={<Switch color="warning"
                  onChange={(_, checked) => startStopAuto(checked)}
                  disabled={(!isRecording && workers === 0) || (transcriberStatus === TranscriberStatus.TRANSCRIBING || transcriberStatus === TranscriberStatus.STOPPING)}
                />}
                label={isAuto ? 'Automatinis' : 'Rankinis'}
                checked={isAuto}
                labelPlacement="end"
                id="auto-button"
              />

              <Button variant="contained"
                color="primary"
                onClick={start}
                disabled={workers === 0}
                style={{ display: isRecording ? 'none' : 'block' }}
                className={isRecording ? 'hidden' : ''}
                id="record-button"
              >
                Įrašyti&nbsp;<span style={{ fontSize: '0.8em', fontStyle: 'italic' }}>({workers})</span>
              </Button>

              <AudioRecorder ref={audioRecorderRef} transcriberRef={transcriberRef} />

              <Button variant="contained" color="primary" disabled={!isAnySelectedText || (transcriberStatus === TranscriberStatus.TRANSCRIBING
                || transcriberStatus === TranscriberStatus.STOPPING)} onClick={copyToClipboard}
                id="copy-button"
              >
                Kopijuoti
              </Button>
              <Button variant="contained" color="primary" disabled={!isAnyNotSelected || (transcriberStatus === TranscriberStatus.TRANSCRIBING || transcriberStatus === TranscriberStatus.STOPPING)} onClick={selectAll}
                id="select-all-button"
              >
                Pažymėti visus
              </Button>
            </Box>
          </Box>

        </Box>

        <Joyride
          steps={introSteps}
          run={runTour}
          continuous
          showSkipButton
          scrollToFirstStep={true}
          locale={{
            back: "Atgal",
            close: "Uždaryti",
            last: "Pabaigti turą",
            next: "Toliau",
            skip: "Praleisti paaiškinimo turą",
            open: "Atidaryti paaiškinimo turą"
          }}
          styles={{
            options: {
              primaryColor: theme.palette.warning.main,
              textColor: theme.palette.text.primary,
              backgroundColor: theme.palette.background.paper,
              overlayColor: overlayColor
            }
          }}
          callback={(data) => {
            const { status, action } = data;
            tourStatusChanged(status);
          }}
        />
      </FullSizeCenteredFlexBox>
      <audio ref={startAudioRef} src={startSound} preload="auto" />
      <audio ref={stopAudioRef} src={stopSound} preload="auto" />
    </>
  );
}

export default Transcriber;
