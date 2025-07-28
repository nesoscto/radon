import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Divider, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import { isAuthenticated } from '../api/client';
import { useState } from 'react';
import nesosLogo from '../assets/nesos-logo.png';
import { COLORS } from '../theme';

function Navbar() {
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width:900px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  if (!isAuthenticated()) return null;
  const navLinks = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Devices', to: '/devices' },
    { label: 'Profile', to: '/profile' },
  ];
  const navButtonStyle = {
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.12)',
      color: '#fff',
    },
    '&.Mui-selected, &[aria-current="page"]': {
      backgroundColor: '#fff',
      color: COLORS.PRIMARY,
    },
  };
  return (
    <AppBar position="static" color="primary" sx={{ mb: 4 }}>
      <Toolbar>
        <Box
          component={RouterLink}
          to="/dashboard"
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            '&:hover, &:focus': {
              backgroundColor: 'transparent',
            },
          }}
        >
          <img 
            src={nesosLogo} 
            alt="Nesos Group Logo" 
            style={{ 
              height: '40px', 
              width: 'auto'
            }} 
          />
        </Box>
        {isDesktop ? (
          <>
            {navLinks.map(link => (
              <Button
                key={link.to}
                component={RouterLink}
                to={link.to}
                sx={{ ...navButtonStyle, ...(location.pathname === link.to && { backgroundColor: '#fff', color: COLORS.PRIMARY }) }}
              >
                {link.label}
              </Button>
            ))}
            <LogoutButton sx={navButtonStyle} />
          </>
        ) : (
          <>
            <IconButton
              color="inherit"
              edge="end"
              onClick={() => setDrawerOpen(true)}
              sx={{ ml: 1 }}
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
            >
              <Box sx={{ width: 220 }} role="presentation" onClick={() => setDrawerOpen(false)}>
                <List>
                  {navLinks.map(link => (
                    <ListItem key={link.to} disablePadding>
                      <ListItemButton component={RouterLink} to={link.to} selected={location.pathname === link.to}>
                        <ListItemText primary={link.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <LogoutButton sx={{ width: '100%' }} />
                </Box>
              </Box>
            </Drawer>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 