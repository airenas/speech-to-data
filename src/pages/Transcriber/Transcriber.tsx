import { useTranscriber } from '@/app-context/AppContext';
import ClearButton from '@/components/clear-button';
import Meta from '@/components/Meta';
import { FullSizeCenteredFlexBox } from '@/components/styled';
import useNotifications from '@/store/notifications';
import { Box, Button, Checkbox, FormControlLabel, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


function Transcriber() {
  const [, notificationsActions] = useNotifications();
  const [name, setName] = useState<string>('');
  const [nameError, setNameError] = useState(false);
  const [office, setOffice] = useState<string>('');
  const [officeError, setOfficeError] = useState(false);
  const [speakers, setSpeakers] = useState<number>(0);
  const [speakersError, setSpeakersError] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState(false);
  const [fileSize, setFileSize] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  // const [lists, setLists] = useState<EditableList[]>([]);
  // const [nextId, setNextId] = useState(1);

  const { lists, setLists, nextId, setNextId } = useTranscriber();

  const addList = () => {
    setLists([...lists, { id: nextId, content: '', selected: false }]);
    setNextId(nextId + 1);
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

  useEffect(() => {
    const savedName = localStorage.getItem('form-name');
    const savedOffice = localStorage.getItem('form-office');
    const savedSpeakerCount = localStorage.getItem('form-speakers');

    if (savedName) setName(savedName);
    if (savedOffice) setOffice(savedOffice);
    if (savedSpeakerCount) setSpeakers(Number(savedSpeakerCount));
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
            <Button variant="contained" color="primary" onClick={addList}>
              Įrašyti
            </Button>
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
