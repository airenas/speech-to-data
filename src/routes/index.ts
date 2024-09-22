import InfoIcon from '@mui/icons-material/Info';
import HomeIcon from '@mui/icons-material/Home';

import asyncComponentLoader from '@/utils/loader';

import { Pages, Routes } from './types';
import { makeLink } from '@/config';

const routes: Routes = {
  [Pages.Transcriber]: {
    component: asyncComponentLoader(() => import('@/pages/Transcriber')),
    path: makeLink('/'),
    title: 'Transkribatorius',
    icon: HomeIcon,
  },
  [Pages.About]: {
    component: asyncComponentLoader(() => import('@/pages/About')),
    path: makeLink('/about'),
    title: 'Apie',
    icon: InfoIcon,
  },
  [Pages.NotFound]: {
    component: asyncComponentLoader(() => import('@/pages/NotFound')),
    path: '*',
  },
};

export default routes;
