import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { PageNavigation } from './components/PageNavigation';
import { BluetoothScreen } from './screens/BluetoothScreen';
import { ColorPickerScreen } from './screens/ColorPickerScreen';

function App() {
  return (
    <>
      <BrowserRouter>
        <PageNavigation />
        <Routes>
          <Route path="/" element={<ColorPickerScreen />} />
          <Route path="/bluetooth" element={<BluetoothScreen />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
