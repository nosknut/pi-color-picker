import React, { useEffect, useState } from 'react';

import logo from './logo.svg';

import './App.css';

type NumberInputProps = {
  label: string
  value: number
  onChange: (value: number) => void
}

function NumberInput({ label, value, onChange }: NumberInputProps) {
  const [state, setState] = useState<string>(String(value))

  useEffect(() => {
    setState(String(value))
  }, [setState, value])

  return (
    <label>
      {`${label}: `}
      <input
        type="number"
        value={state || ''}
        onChange={(e) => {
          const val = e.target.value
          const num = Number(val)
          setState(val)
          if (!isNaN(num)) {
            onChange(num)
          }
        }}
      />
    </label>
  )
}

function App() {

  const [height, setHeight] = useState(8)
  const [width, setWidth] = useState(8)
  const [matrix] = useState([])

  useEffect(() => {

  }, [height, width])

  return (
    <div className="App">
      <div className="sidebar">
        <NumberInput label="X" value={height} onChange={setHeight} />
        <NumberInput label="Y" value={width} onChange={setWidth} />
      </div>
      <div>
      </div>
      { }
    </div>
  );
}

export default App;
