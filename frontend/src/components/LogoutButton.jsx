import { Button } from '@mui/material';
import { logout } from '../api/client';

function LogoutButton({ sx }) {
  return (
    <Button color="inherit" onClick={logout} sx={sx}>
      Logout
    </Button>
  );
}

export default LogoutButton; 