import { useAppContext } from '@/app-context/AppContext';
import Meta from '@/components/Meta';
import { FullSizeCenteredFlexBox } from '@/components/styled';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAppContext();

  const handleLogin = async () => {
    login(username, password);
  };

  const handleKeyDown = (event: { key: string; preventDefault: () => void; }) => {
    if (event.key === 'Enter' && canLogin()) {
      event.preventDefault();
      handleLogin();
    }
  };

  function canLogin(): boolean {
    if (username && password) {
      return true;
    }
    return false;
  }

  return (
    <>
      <Meta title="Prisijungti" />
      <FullSizeCenteredFlexBox>
        <div>
          {/* <Typography variant="h2">Prisijungimas</Typography> */}
          <TextField
            label="Vartotojas"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <TextField
            label="Slaptažodis"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleLogin}
            disabled={!canLogin()}
            style={{ marginTop: '16px' }}
          >
            Prisijungti
          </Button>
        </div>
      </FullSizeCenteredFlexBox>
    </>
  );
}

export default Login;

