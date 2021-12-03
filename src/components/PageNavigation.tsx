import { Palette, Sensors } from '@mui/icons-material';
import { Avatar, Box, IconButton, Toolbar, Typography } from '@mui/material';
import AppBar from '@mui/material/AppBar/AppBar';
import React from 'react';
import { Route, Routes } from 'react-router';
import { Link } from 'react-router-dom';
import { ThemeButton } from '../components/Pixel/Themes';
import { ColorPickerTutorialButton } from '../screens/ColorPickerScreen';
import { InstallAppButton } from './InstallAppButton';


export function PageNavigation() {
    return (
        <AppBar position="relative">
            <Toolbar>
                <Avatar src="/icons/logo.png">
                    <Palette />
                </Avatar>
                <Box mr={1} />
                <Typography variant="h6">PI Color Picker</Typography>
                <Box mr="auto" />
                <InstallAppButton />
                <Routes>
                    <Route path="/" element={<IconButton sx={{ color: "white" }} component={Link} to="/sensors"> <Sensors /> </IconButton>} />
                    <Route path="/sensors/*" element={<IconButton sx={{ color: "white" }} component={Link} to="/"> <Palette /> </IconButton>} />
                </Routes>
                <ColorPickerTutorialButton />
                <ThemeButton />
            </Toolbar>
        </AppBar>
    )
}