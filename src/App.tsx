import { Add, Help, Palette } from '@mui/icons-material';
import { Avatar, Box, Fab, FormControl, FormControlLabel, FormLabel, Grid, IconButton, Radio, RadioGroup, Toolbar, Tooltip, Typography } from '@mui/material';
import AppBar from '@mui/material/AppBar/AppBar';
import useLocalStorage from '@rehooks/local-storage';
import { Step, Steps } from 'intro.js-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { ColorPicker, CopyMode, DEFAULT_COLOR, GRAY, LIGHT_GRAY, MatrixCard, MatrixConfig } from './components/MatrixCard';
import { Rgb } from './components/Pixel/Pixel';
import { ThemeButton, useDarkMode } from './components/Pixel/Themes';


function useStateHistory<T>(value: T) {
  const [historyIndex, setHistoryIndex] = useState<number>(0)
  const [history] = useState<{ values: T[] }>({ values: [value] })
  const newest = history.values[history.values.length - 1]

  useEffect(() => {
    if (value !== newest) {
      history.values = [...history.values.slice(0, historyIndex + 1), value]
      setHistoryIndex(history.values.length - 1)
    }
  }, [value, newest, history, setHistoryIndex, historyIndex])

  useEffect(() => {
    function listener(e: KeyboardEvent) {
      if (e.ctrlKey && (e.code === 'KeyZ')) {
        setHistoryIndex(Math.max(0, historyIndex - 1))
      }
      if (e.ctrlKey && (e.code === 'KeyY')) {
        setHistoryIndex(Math.min(history.values.length - 1, historyIndex + 1))
      }
    }
    window.addEventListener('keypress', listener)
    return () => {
      window.removeEventListener('keypress', listener)
    }
  }, [setHistoryIndex, historyIndex, history])

  return [
    value === newest ? history.values[historyIndex] : value,
  ]
}

function makeSteps(lastMatrixId: string): Step[] {
  const lastId = lastMatrixId.replace('.', '\\.')
  return [
    { element: "#add-matrix-btn", intro: 'Create a new matrix' },
    { element: "#matrix-card-name-" + lastId, intro: 'Set the name of your matrix. This will be used when generating code' },
    { element: "#matrix-card-height-" + lastId, intro: 'Set the pixel height of your matrix' },
    { element: "#matrix-card-height-" + lastId + '-save', intro: 'Click the save button when you have set a new height' },
    { element: "#matrix-card-width-" + lastId, intro: 'Set the pixel width of your matrix' },
    { element: "#matrix-card-width-" + lastId + '-save', intro: 'Click the save button when you have set a new width' },
    { element: "#color-picker", intro: 'Pick a color you like' },
    { element: "#matrix-card-" + lastId + ' .pixels', intro: 'Start drawing something! Click a pixel, or hold the left mouse button while draging to draw with your selected color. Hold shift to remove the color from a pixel' },
    { element: "#matrix-card-" + lastId + ' .save-indicator', intro: 'Your work is saved 1sec after you stop changing things' },
    { element: "#matrix-card-" + lastId + ' .copy', intro: 'Copy the matrix' },
    { element: "#matrix-card-" + lastId + ' .clear', intro: 'Clear the matrix content' },
    { element: "#matrix-card-" + lastId + ' .fill', intro: 'Fill the matrix with the selected color' },
    { element: "#copy-mode-form", intro: 'Select the export format' },
    { element: "#matrix-card-" + lastId + ' .copy-code', intro: 'Copy the code to your clipboard' },
    { element: "#matrix-card-" + lastId + ' .copy-code', intro: 'Now paste the code into your editor and watch the magic ;)' },
    { element: "#matrix-card-" + lastId + ' .copy', intro: 'Make another copy' },
    { element: "#matrix-card-" + lastId + ' .delete', intro: 'Now delete this matrix' },
    { intro: 'All set! Happy coding :)' },
  ]
}

function App() {
  const [copyMode, setCopyMode] = useState<CopyMode>('json')
  const [darkMode] = useDarkMode()
  const [selectedColor, setSelectedColor] = useState<Rgb>(DEFAULT_COLOR)
  const [stored, setMatrixes] = useLocalStorage<{ [id: string]: MatrixConfig }>('matrixes', {})
  const emptyColor = darkMode ? GRAY : LIGHT_GRAY
  const [matrixes] = useStateHistory(stored)
  const [tutorial, setTutorial] = useLocalStorage('tutorial', { show: true, step: 0 })
  const lastId = useMemo(() => {
    const [, lastId] = Object.values(matrixes).reduce(([timestamp, id], mat) => mat.created > timestamp ? [mat.created, mat.id] : [timestamp, id], ['', ''])
    return lastId

  }, [matrixes])
  const lastRef = useRef<any>()
  const [scrollTo, setScrollTo] = useState('')

  useEffect(() => {
    if (scrollTo === lastId) {
      lastRef.current?.scrollIntoView?.({ behavior: 'smooth' })
    }
  }, [scrollTo, lastId, lastRef])

  return (
    <>
      <Steps
        enabled={tutorial.show}
        initialStep={tutorial.step || 0}
        steps={useMemo(() => makeSteps(lastId), [lastId])}
        onExit={(step) => setTutorial({ show: false, step })}
        onComplete={() => setTutorial({ show: false, step: 0 })}
        onChange={(step) => setTutorial({ ...tutorial, step })}
        options={{
          disableInteraction: false,
          showProgress: true,
          showStepNumbers: true,
        }}
      />
      <AppBar position="fixed">
        <Toolbar>
          <Avatar src="https://pi-color-picker.web.app/logo.png">
            <Palette />
          </Avatar>
          <Box mr={1} />
          <Typography variant="h6">PI Color Picker</Typography>
          <Box mr="auto" />
          <IconButton style={{ color: 'white' }} onClick={() => setTutorial({ ...tutorial, show: true })}>
            <Help />
          </IconButton>
          <ThemeButton />
        </Toolbar>
      </AppBar>
      <Toolbar />
      <Toolbar sx={{ marginTop: 1 }}>
        <FormControl component="fieldset" id="copy-mode-form">
          <FormLabel component="span">Copy as</FormLabel>
          <RadioGroup
            row
            aria-label="copyMode"
            name="controlled-radio-buttons-group"
            value={copyMode}
            onChange={e => setCopyMode(e.target.value as CopyMode)}
          >
            <FormControlLabel value="json" control={<Radio />} label="Json" />
            <FormControlLabel value="python" control={<Radio />} label="Python" />
          </RadioGroup>
        </FormControl>
      </Toolbar>
      <div id="add-matrix-btn" style={{ zIndex: 5000, position: 'fixed', bottom: 20, right: 20 }}>
        <Tooltip title="Add Matrix" placement="top">
          <Fab
            color="primary"
            onClick={() => {
              const id = Math.random().toString()
              setMatrixes({
                ...matrixes,
                [id]: {
                  id,
                  name: '',
                  created: new Date().toISOString(),
                  width: 8,
                  height: 8,
                  matrix: {}
                }
              })
              setScrollTo(id)
              if (tutorial.show) {
                setTutorial({ ...tutorial, show: false })
                setTimeout(() => {
                  setTutorial({ step: tutorial.step + 1, show: true })
                }, 10)
              }
            }}
          >
            <Add />
          </Fab>
        </Tooltip>
      </div>
      <main>
        <Grid mt={2} container justifyContent="center" direction="row" spacing={2}>
          <Grid item>
            <Draggable>
              <ColorPicker value={selectedColor} onChange={setSelectedColor} />
            </Draggable>
          </Grid>
          {Object.values(matrixes).map(matrix => {
            return (
              <Grid key={matrix.id} item>
                <MatrixCard
                  ref={lastRef}
                  copyMode={copyMode}
                  emptyColor={emptyColor}
                  config={matrix}
                  selectedColor={selectedColor}
                  onDelete={() => {
                    const { [matrix.id]: current, ...others } = matrixes
                    setMatrixes(others)
                    if (tutorial.show) {
                      setTutorial({ ...tutorial, show: false })
                      setTimeout(() => {
                        setTutorial({ step: tutorial.step + 1, show: true })
                      }, 10)
                    }
                  }}
                  onCopy={() => {
                    const id = Math.random().toString()
                    setMatrixes({
                      ...matrixes,
                      [id]: {
                        ...matrix,
                        id,
                        created: new Date().toISOString(),
                      },
                    })
                    setScrollTo(id)
                    if (tutorial.show) {
                      setTutorial({ ...tutorial, show: false })
                      setTimeout(() => {
                        setTutorial({ step: tutorial.step + 1, show: true })
                      }, 10)
                    }
                  }}
                  onChange={value => {
                    setMatrixes({
                      ...matrixes,
                      [value.id]: value,
                    })
                  }}
                />
              </Grid>
            )
          })}
        </Grid>
      </main>
    </>
  );
}

export default App;
