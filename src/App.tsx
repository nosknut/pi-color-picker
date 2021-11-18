import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { PageNavigation } from './components/PageNavigation';
import { ColorPickerScreen } from './screens/ColorPickerScreen';
import { SensorScreen } from './screens/SensorScreen';

function App() {
  return (
    <BrowserRouter>
      <PageNavigation />
      <Routes>
        <Route path="/" element={<ColorPickerScreen />} />
        <Route path="/sensors/*" element={<SensorScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
