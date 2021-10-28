import { Add, Check, ContentCopy, Save } from '@mui/icons-material';
import { Box, Button, Card, CardActions, CardContent, CardHeader, CircularProgress, Fab, FormControl, FormControlLabel, FormLabel, Grid, IconButton, Radio, RadioGroup, TextField, Toolbar, Tooltip, Typography, useTheme } from '@mui/material';
import AppBar from '@mui/material/AppBar/AppBar';
import useLocalStorage from '@rehooks/local-storage';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SketchPicker } from 'react-color';
import Draggable from 'react-draggable';
import { Pixel, Rgb } from './components/Pixel/Pixel';
import { ThemeButton, useDarkMode } from './components/Pixel/Themes';
import copy from 'clipboard-copy';

type Matrix<T> = {
  [y: number]: {
    [x: number]: T
  }
}

const BLACK: Rgb = [0, 0, 0]
const LIGHT_GRAY: Rgb = [200, 200, 200]
const GRAY: Rgb = [100, 100, 100]
const DEFAULT_COLOR: Rgb = [80, 150, 180]

type NumberInputProps = {
  label: string
  onChange: (value: number) => void
  value: number
}

function NumberInput({ label, onChange, value }: NumberInputProps) {
  const [state, setState] = useState(String(value))

  useEffect(() => {
    setState(String(value))
  }, [value, setState])

  const asNumber = Number(state || NaN)
  const isValid = !isNaN(asNumber)

  return (
    <TextField
      fullWidth
      type="number"
      label={label}
      value={state}
      onChange={(e) => {
        setState(e.target.value)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (isValid) {
            onChange(asNumber)
          }
        }
      }}
      InputProps={{
        endAdornment: (
          <IconButton disabled={!isValid || (asNumber === value)} color="primary" onClick={() => onChange(asNumber)}>
            <Save />
          </IconButton>
        )
      }}
    />
  )
}

type MatrixConfig = {
  id: string
  name: string
  height: number
  width: number
  matrix: Matrix<Rgb>
}

type MatrixCardProps = {
  config: MatrixConfig
  selectedColor: Rgb
  onChange: (value: MatrixConfig) => void
  onDelete: () => void
  onCopy: () => void
  emptyColor: Rgb
  copyMode: CopyMode
}

function pythonFrom(config: MatrixConfig) {
  const { name, height, width, matrix } = config

  const content = (
    Array.from(Array(height).keys()).map((r) => {
      return Array.from(Array(width).keys()).map((c) => {
        return `(${(matrix[r]?.[c] || BLACK).join(', ')})`
      }).join(', ')
    }).join('],\n    [')
  )
  return `
${name.toUpperCase().replaceAll(' ', '_')} = [
    [${content}],
]
`.trim()
}

function MatrixCard({ config, onChange, onDelete, onCopy, selectedColor, emptyColor, copyMode }: MatrixCardProps) {
  const [state, setState] = useState(config)
  const { height, width, name, matrix } = state

  const propagateChange = useMemo(() => _.debounce((newConfig: MatrixConfig) => {
    onChange(newConfig)
  }, 1000), [onChange])

  const update = useCallback((changes: Partial<MatrixConfig>) => {
    const newConfig = { ...state, ...changes }
    setState(newConfig)
    propagateChange(newConfig)
  }, [state, setState, propagateChange])

  useEffect(() => {
    setState(config)
  }, [config, setState])

  return (
    <Card elevation={2}>
      <CardContent>
        <Box mb={1}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <Tooltip placement="top" title="Copy to clipboard">
              <IconButton color="primary" size="small" onClick={() => copy(copyMode === 'json' ? JSON.stringify(config, null, 2) : pythonFrom(config))}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
            <Tooltip color="success" placement="top" title={state !== config ? 'Saving ...' : 'Saved'}>
              <IconButton size="small">
                {
                  state !== config ? <CircularProgress color="success" size={24} /> : <Check />
                }
              </IconButton>
            </Tooltip>
          </div>
        </Box>
        <TextField fullWidth label="Name" type="text" value={name} onChange={(e) => update({ name: e.target.value ?? '' })} />
        <Box mx={2} my={2} />
        <NumberInput label="Height" value={height} onChange={value => update({ height: value })} />
        <Box mx={2} my={2} />
        <NumberInput label="Width" value={width} onChange={value => update({ width: value })} />
        <Box mx="auto" mt={2} onDragStart={e => e.preventDefault()}>
          {Array.from(Array(height).keys()).map((iRow) => {
            return (
              <div key={iRow} style={{ textAlign: 'center' }} onDragStart={e => e.preventDefault()}>
                {Array.from(Array(width).keys()).map((iColumn) => {
                  return (
                    <Pixel
                      key={iColumn}
                      color={matrix[iRow]?.[iColumn] || emptyColor}
                      onChange={(clear) => {
                        const { [iRow]: { [iColumn]: current, ...row } = {}, ...rows } = matrix
                        const newValue = clear ? {} : {
                          [iColumn]: selectedColor,
                        }
                        const newRowValues = {
                          ...row,
                          ...newValue,
                        }
                        update({
                          matrix: {
                            ...rows,
                            ...(Object.values(newRowValues).length ? {
                              [iRow]: newRowValues,
                            } : {})
                          },
                        })
                      }}
                    />
                  )
                })}
              </div>
            )
          })}
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: 'right' }}>
        <Button color="primary" onClick={onCopy}>Copy</Button>
        <Button onClick={() => {
          onChange({
            ...config,
            matrix: Array.from(Array(height).keys()).reduce((mat, r) => {
              mat[r] = Array.from(Array(width).keys()).reduce((colAcc, c) => {
                colAcc[c] = selectedColor
                return colAcc
              }, {} as { [x: string]: Rgb })
              return mat
            }, {} as Matrix<Rgb>)
          })
        }
        }>Fill</Button>
        <Button color="primary" onClick={() => onChange({ ...config, matrix: {} })}>Clear</Button>
        <Button color="primary" onClick={onDelete}>Delete</Button>
      </CardActions>
    </Card>
  )
}

type ColorPickerProps = {
  onChange: (value: Rgb) => void
  value: Rgb
}

function ColorPicker({ onChange, value }: ColorPickerProps) {
  const theme = useTheme()
  const [state, setState] = useState(value)

  useEffect(() => {
    setState(value)
  }, [value, setState])

  return (
    <Card>
      <CardHeader title="Select color" />
      <CardContent>
        <SketchPicker
          styles={{
            default: {
              picker: {
                background: theme.palette.background.paper,
              }
            }
          }}
          color={{ r: state[0], g: state[1], b: state[2] }}
          onChangeComplete={(color) => {
            onChange([
              color.rgb.r,
              color.rgb.g,
              color.rgb.b,
            ])
          }}
          onChange={(color) => {
            setState([
              color.rgb.r,
              color.rgb.g,
              color.rgb.b,
            ])
          }} />
      </CardContent>
    </Card>
  )
}

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


type CopyMode = 'python' | 'json'
function App() {
  const [copyMode, setCopyMode] = useState<CopyMode>('json')
  const [darkMode] = useDarkMode()
  const [selectedColor, setSelectedColor] = useState<Rgb>(DEFAULT_COLOR)
  const [stored, setMatrixes] = useLocalStorage<{ [id: string]: MatrixConfig }>('matrixes', {})
  const emptyColor = darkMode ? GRAY : LIGHT_GRAY
  const [matrixes] = useStateHistory(stored)
  return (
    <>
      <AppBar position="fixed">
        <Toolbar sx={{
          justifyContent: 'space-between',
        }}>
          <Typography variant="h6">PI Color Picker</Typography>
          <ThemeButton />
        </Toolbar>
      </AppBar>
      <Toolbar />
      <Toolbar sx={{ marginTop: 1 }}>
        <FormControl component="fieldset">
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
      <div style={{ zIndex: 5000, position: 'fixed', bottom: 20, right: 20 }}>
        <Tooltip title="Add Matrix" placement="top">
          <Fab
            color="primary"
            onClick={() => {
              const id = Math.random()
              setMatrixes({
                ...matrixes,
                [id]: {
                  id,
                  name: '',
                  width: 8,
                  height: 8,
                  matrix: {}
                }
              })
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
                  copyMode={copyMode}
                  emptyColor={emptyColor}
                  config={matrix}
                  selectedColor={selectedColor}
                  onDelete={() => {
                    const { [matrix.id]: current, ...others } = matrixes
                    setMatrixes(others)
                  }}
                  onCopy={() => {
                    const id = Math.random().toString()
                    setMatrixes({
                      ...matrixes,
                      [id]: { ...matrix, id },
                    })
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
