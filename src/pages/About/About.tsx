import Typography from '@mui/material/Typography';

import Meta from '@/components/Meta';
import { FullSizeCenteredFlexBox } from '@/components/styled';
import { VERSION } from '@/version';

function About() {
  return (
    <>
      <Meta title="apie" />
      <FullSizeCenteredFlexBox>
        <div>
          <Typography variant="h2">Realaus laiko Audio Transkribatorius</Typography>
          <Typography variant="body1">Sukurta: VDU ir UAB Intelektika"</Typography>
          <Typography variant="body1">Versija: {VERSION}</Typography>
        </div>
      </FullSizeCenteredFlexBox>
    </>
  );
}

export default About;
