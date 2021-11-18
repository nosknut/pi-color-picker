import { Palette } from '@mui/icons-material';
import { Avatar, Box, Toolbar, Typography } from '@mui/material';
import AppBar from '@mui/material/AppBar/AppBar';
import React from 'react';

import { ThemeButton } from './components/Pixel/Themes';
import { ColorPickerScreen, ColorPickerTutorialButton } from './screens/ColorPickerScreen';

function App() {
  return (
    <>
      <AppBar position="relative">
        <Toolbar>
          <Avatar src="https://pi-color-picker.web.app/logo.png">
            <Palette />
          </Avatar>
          <Box mr={1} />
          <Typography variant="h6">PI Color Picker</Typography>
          <Box mr="auto" />
          <ColorPickerTutorialButton />
          <ThemeButton />
        </Toolbar>
      </AppBar>
      <ColorPickerScreen />
    </>
  );
}

export default App;
