import { Route, Routes } from 'react-router-dom';

import { checkLogged } from '@/hooks/checkLogged';
import { useKeepAlivePing } from '@/hooks/keepAlive';
import Box from '@mui/material/Box';
import routes from '..';
import { getPageHeight } from './utils';

function Pages() {
  useKeepAlivePing();
  checkLogged();
  return (
    <Box sx={{ height: (theme) => getPageHeight(theme) }}>
      <Routes>
        {Object.values(routes).map(({ path, component: Component }) => {
          return <Route key={path} path={path} element={<Component />} />;
        })}
      </Routes>
    </Box>
  );
}

export default Pages;
