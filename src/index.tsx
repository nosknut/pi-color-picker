import { CssBaseline } from '@mui/material';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Themes } from './components/Pixel/Themes';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <Themes>
      <CssBaseline>
        <App />
      </CssBaseline>
    </Themes>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
