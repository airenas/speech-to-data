import { useAppContext } from '@/app-context/AppContext';
import Meta from '@/components/Meta';
import { FullSizeCenteredFlexBox } from '@/components/styled';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useState } from 'react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTimeout, setPasswordTimeout] = useState<NodeJS.Timeout | null>(null);
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

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    if (passwordTimeout) {
      clearTimeout(passwordTimeout);
    }

    if (!showPassword) {
      const timeout = setTimeout(() => {
        setShowPassword(false);
      }, 5000);
      setPasswordTimeout(timeout);
    }
  };

  return (
    <>
      <Meta title="prisijungti" />
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
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
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

