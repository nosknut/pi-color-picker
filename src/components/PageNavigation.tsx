import { Bluetooth, Palette } from '@mui/icons-material';
import { Avatar, Box, IconButton, Toolbar, Typography } from '@mui/material';
import AppBar from '@mui/material/AppBar/AppBar';
import React from 'react';
import { Route, Routes } from 'react-router';
import { Link } from 'react-router-dom';

import { ThemeButton } from '../components/Pixel/Themes';
import { ColorPickerTutorialButton } from '../screens/ColorPickerScreen';

export function PageNavigation() {
    return (
        <AppBar position="relative">
            <Toolbar>
                <Avatar src="https://pi-color-picker.web.app/logo.png">
                    <Palette />
                </Avatar>
                <Box mr={1} />
                <Typography variant="h6">PI Color Picker</Typography>
                <Box mr="auto" />
                <Routes>
                    <Route path="/" element={<IconButton component={Link} to="/bluetooth"> <Bluetooth /> </IconButton>} />
                    <Route path="/bluetooth" element={<IconButton component={Link} to="/"> <Palette /> </IconButton>} />
                </Routes>
                <ColorPickerTutorialButton />
                <ThemeButton />
            </Toolbar>
        </AppBar>
    )
}