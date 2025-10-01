import { useLocation, useNavigate } from 'react-router-dom';

import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import ThemeIcon from '@mui/icons-material/InvertColors';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { Typography } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';

import { useAppContext } from '@/app-context/AppContext';
import { FlexBox } from '@/components/styled';
import { makeLink, title } from '@/config';
import useSidebar from '@/store/sidebar';
import useTheme from '@/store/theme';

function Header() {
  const [, sidebarActions] = useSidebar();
  const [theme, themeActions] = useTheme();
  const navigate = useNavigate();
  const { user, logout, isTour, setTour, isRecording } = useAppContext();
  const location = useLocation();
  const isLoginPage = location.pathname === makeLink('/login');
  const isTranscriptionPage = location.pathname === makeLink('/');

  const handleLogout = async () => {
    logout();
  };

  const handleHelp = async () => {
    setTour(true);
    if (user) {
      user.skipTour = false;
    }
  };

  const handleLogin = async () => {
    navigate(makeLink('/login'));
  };

  return (
    <Box sx={{ flexGrow: 1 }} data-pw={`theme-${theme}`}>
      <AppBar color="transparent" elevation={1} position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <FlexBox sx={{ alignItems: 'center' }}>
            <IconButton
              onClick={sidebarActions.toggle}
              size="large"
              edge="start"
              color="info"
              aria-label="menu"
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1 }}
              color={theme === 'light' ? 'primary' : 'text.secondary'}
            >
              {title}
            </Typography>
          </FlexBox>
          <FlexBox>
            {!user && !isLoginPage && (
              <>
                <Tooltip title="Prisijungti" arrow>
                  <IconButton
                    color="info"
                    edge="end"
                    size="large"
                    onClick={handleLogin}
                    data-pw="login"
                  >
                    <LoginIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            {user && (
              <Box display="flex" alignItems="center">
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                  <span
                    style={{
                      fontStyle: 'italic',
                      fontWeight: 'lighter',
                      color: 'inherit',
                      fontSize: '0.8em',
                      marginRight: '10px',
                    }}
                  >
                    Sveiki
                  </span>
                  <span style={{ fontWeight: 'bold', color: 'inherit' }}>{user.name}</span>
                </Typography>
                <Tooltip title="Atsijungti" arrow>
                  <IconButton
                    color="error"
                    edge="end"
                    size="large"
                    onClick={handleLogout}
                    data-pw="logout"
                    id="logout-button"
                    disabled={isRecording}
                  >
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            {user && isTranscriptionPage && (
              <Box display="flex" alignItems="center">
                <Divider orientation="vertical" flexItem />
                <Tooltip title="Paaiškinimo turas" arrow>
                  <IconButton
                    color="info"
                    edge="end"
                    size="large"
                    onClick={handleHelp}
                    data-pw="help-center"
                    disabled={isRecording || isTour}
                  >
                    <HelpCenterIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Pakeisti temą" arrow>
              <IconButton
                color="info"
                edge="end"
                size="large"
                onClick={themeActions.toggle}
                data-pw="theme-toggle"
              >
                <ThemeIcon />
              </IconButton>
            </Tooltip>
          </FlexBox>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default Header;
