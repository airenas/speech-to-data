import ThemeIcon from '@mui/icons-material/InvertColors';
import MenuIcon from '@mui/icons-material/Menu';
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
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

function Header() {
  const [, sidebarActions] = useSidebar();
  const [theme, themeActions] = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAppContext();
  const location = useLocation();
  const isLoginPage = location.pathname === makeLink('/login'); 

  const handleLogout = async () => {
    logout();
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
            {!user && !isLoginPage && (<>
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
            {user && (<Box display="flex" alignItems="center">
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                <span style={{ fontStyle: 'italic', fontWeight: 'lighter', color: 'inherit', fontSize: "0.8em", marginRight: '10px' }}>Sveiki</span> 
                <span style={{ fontWeight: 'bold', color: 'inherit' }}>{user.name}</span> 
              </Typography>
              <Tooltip title="Atsijungti" arrow>
                <IconButton
                  color="error"
                  edge="end"
                  size="large"
                  onClick={handleLogout}
                  data-pw="logout"
                >
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Box>
            )}
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Switch theme" arrow>
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
