import { useEffect, useState } from 'react';

import { Button } from '@mui/material';
import Typography from '@mui/material/Typography';

import { useAppContext } from '@/app-context/AppContext';
import Meta from '@/components/Meta';
import { FullSizeCenteredFlexBox } from '@/components/styled';
import configService from '@/services/configService';
import { VERSION } from '@/version';

function About() {
  const { user } = useAppContext();
  const [isDemoEnabled, setIsDemoEnabled] = useState(false);

  useEffect(() => {
    if (user && !user.skipTour) {
      setIsDemoEnabled(true);
    } else {
      setIsDemoEnabled(false);
    }
  }, [user]);

  function turnOnDemoTour() {
    if (!user) {
      return;
    }
    (async () => {
      try {
        await configService.save({ skipTour: false });
        setIsDemoEnabled(true);
        if (user) {
          user.skipTour = false;
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }

  return (
    <>
      <Meta title="apie" />
      <FullSizeCenteredFlexBox>
        <div>
          <Typography variant="h2">DiPolis Audio Transkribatorius</Typography>
          <Typography variant="body1">Sukurta: VDU</Typography>
          <Typography variant="body1">Versija: {VERSION}</Typography>

          <Button
            variant="contained"
            color="primary"
            disabled={isDemoEnabled}
            onClick={turnOnDemoTour}
            style={{ display: !user ? 'none' : 'block' }}
          >
            Įjungti demo turą
          </Button>
        </div>
      </FullSizeCenteredFlexBox>
    </>
  );
}

export default About;
