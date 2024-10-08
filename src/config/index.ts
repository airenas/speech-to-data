import isMobile from '@/utils/is-mobile';

import type { Notifications } from './types';

const title = 'Polis Audio Transkribatorius';

const email = 'airenass@gmail.com';

const serverUrl = import.meta.env.VITE_ENV_SERVER_URL;
const authUrl = import.meta.env.VITE_ENV_AUTH_URL;

const basePath = import.meta.env.VITE_ENV_BASE_PATH;


const repository = 'https://github.com/airenas/speech-to-data';

const messages = {
  app: {
    crash: {
      title: 'Oooops... Kažkas nutiko',
      options: {
        email: `susisiekite - ${email}`,
        reset: 'Press here to reset the application',
      },
    },
  },
  loader: {
    fail: 'Hmmmmm, there is something wrong with this component loading process... Maybe trying later would be the best idea',
  },
  images: {
    failed: 'something went wrong during image loading :(',
  },
  404: 'Oooooooops, puslapio nėra',
};

const dateFormat = 'MMMM DD, YYYY';

const notifications: Notifications = {
  options: {
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'left',
    },
    autoHideDuration: 6000,
  },
  maxSnack: isMobile ? 3 : 4,
};

const loader = {
  // no more blinking in your app
  delay: 300, // if your asynchronous process is finished during 300 milliseconds you will not see the loader at all
  minimumLoading: 700, // but if it appears, it will stay for at least 700 milliseconds
};

const defaultMetaTags = {
  image: '/cover.png',
  description: 'Starter kit for modern web applications',
};

const makeLink = (path: string | undefined): string => {
  const trimmedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const trimmedPath = path?.startsWith('/') ? path.slice(1) : path;
  return `${trimmedBasePath}/${trimmedPath}`;
};

export {
  dateFormat,
  defaultMetaTags,
  email,
  loader,
  makeLink,
  messages,
  notifications,
  repository,
  serverUrl,
  title,
  authUrl,
};
