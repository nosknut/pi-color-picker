import { Check, Colorize, ContentCopy, ContentPaste, Save } from '@mui/icons-material';
import { Box, Button, Card, CardActions, CardContent, CardHeader, CircularProgress, FormControlLabel, FormGroup, IconButton, Switch, TextField, Tooltip, useTheme } from '@mui/material';
import copy from 'clipboard-copy';
import _ from 'lodash';
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { SketchPicker } from 'react-color';

import { useClearMode } from '../atoms/ClearMode';
import { usePickColor } from '../atoms/PickColor';
import { BLACK } from '../constants/Colors';
import { useImperativeState } from '../hooks/useImperativeState';
import { Rgb } from '../types/Rgb';
import { Pixel } from './Pixel/Pixel';

export type Matrix<T> = {
    [y: number]: {
        [x: number]: T
    }
}

export type NumberInputProps = {
    label: string
    onChange: (value: number) => void
    value: number
    id?: string
}

export function NumberInput({ label, onChange, value, id }: NumberInputProps) {
    const [state, setState] = useState(String(value))

    useEffect(() => {
        setState(String(value))
    }, [value, setState])

    const asNumber = Number(state || NaN)
    const isValid = !isNaN(asNumber)

    return (
        <TextField
            id={id}
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
                    <IconButton id={id ? id + '-save' : undefined} disabled={!isValid || (asNumber === value)} color="primary" onClick={() => onChange(asNumber)}>
                        <Save />
                    </IconButton>
                )
            }}
        />
    )
}

export type MatrixConfig = {
    id: string
    name: string
    created: string
    height: number
    width: number
    matrix: Matrix<Rgb>
}

export type CopyMode = 'python' | 'json'

export type MatrixCardProps = {
    config: MatrixConfig
    selectedColor: Rgb
    onChange: (value: MatrixConfig) => void
    onDelete: (config: MatrixConfig) => void
    onCopy: (config: MatrixConfig) => void
    emptyColor: Rgb
    copyMode: CopyMode
}

export function pythonFrom(config: MatrixConfig) {
    const { name, height, width, matrix } = config

    const content = (
        Array.from(Array(height).keys()).map((r) => {
            return Array.from(Array(width).keys()).map((c) => {
                return `(${(matrix[r]?.[c] || BLACK).join(', ')})`
            }).join(', ')
        }).join(',\n    ')
    )
    return `
  ${name.toUpperCase().replaceAll(' ', '_')} = [
      ${content},
  ]
  `.trim()
}

function pythonArrayToJavascript(pythonArray: string): Array<Rgb> | null {
    const pixels = pythonArray.match(/(\d+,\s*\d+,\s*\d+)/g)
    if (!pixels) {
        return null
    }
    return pixels.map((p) => {
        const [r, g, b] = p.split(', ').map((v) => Number(v))
        return [r, g, b]
    })
}

function compareColors(a: Rgb, b: Rgb) {
    const [r1, g1, b1] = a
    const [r2, g2, b2] = b
    return r1 === r2 && g1 === g2 && b1 === b2
}

export function fromPython(config: MatrixConfig, pythonArray: string): MatrixConfig | null {
    const { height, width } = config
    const array: Array<Rgb> | null = pythonArrayToJavascript(pythonArray)
    if(!array) {
        return null
    }
    const matrix: Matrix<Rgb> = {}
        Array.from(Array(height).keys()).forEach((x) => {
            return Array.from(Array(width).keys()).forEach((y) => {
                const value = array[y * width + x]
                if (value && !compareColors(value, BLACK)) {
                    matrix[y] = matrix[y] || {}
                    matrix[y][x] = value
                }
            })
        })
  return {
      ...config,
      matrix: {
          ...matrix,
      },
  }
}

export const MatrixCard = React.memo(forwardRef(({ config, onChange, onDelete, onCopy, selectedColor, emptyColor, copyMode }: MatrixCardProps, ref) => {
    const [state, setState] = useState(config)
    const { height, width, name, matrix } = state
    const [clearMode] = useClearMode()
    const [pickColor, , setActiveColor] = usePickColor()
    const propagateChange = useMemo(() => _.debounce((newConfig: MatrixConfig) => {
        onChange(newConfig)
    }, 1000), [onChange])

    const update = useCallback((changes: Partial<MatrixConfig>) => {
        const newConfig = { ...state, ...changes }
        setState(newConfig)
        propagateChange(newConfig)
    }, [state, setState, propagateChange])

    const imperativeState = useImperativeState({ selectedColor, update, clearMode, matrix, pickColor, setActiveColor })

    useEffect(() => {
        setState(config)
    }, [config, setState])

    // This function is passed to all pixels on the screen. Avoid changing it often
    const setPixel = useCallback((x: number, y: number, clear: boolean, color: Rgb | null) => {
        const { selectedColor, update, clearMode, matrix, pickColor, setActiveColor } = imperativeState.current
        if (pickColor) {
            setActiveColor(color)
        } else {
            const clearPixel = clear || clearMode
            const { [y]: { [x]: current, ...row } = {}, ...rows } = matrix
            const newValue = clearPixel ? {} : {
                [x]: selectedColor,
            }
            const newRowValues = {
                ...row,
                ...newValue,
            }
            update({
                matrix: {
                    ...rows,
                    ...(Object.values(newRowValues).length ? {
                        [y]: newRowValues,
                    } : {})
                },
            })
        }
    }, [imperativeState])

    return (
        <Card elevation={2} id={"matrix-card-" + config.id} ref={ref as any}>
            <CardContent>
                <Box mb={1}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                    <Tooltip placement="top" title="Copy to clipboard">
                            <IconButton color="primary" className="copy-code" size="small" onClick={() => copy(copyMode === 'json' ? JSON.stringify(config, null, 2) : pythonFrom(config))}>
                                <ContentCopy />
                            </IconButton>
                        </Tooltip>                       
                         <Tooltip placement="top" title="Paste from clipboard">
                            <IconButton color="primary" className="paste-code" size="small" onClick={async () => 
                            {
                                const text = await navigator.clipboard.readText()
                                if (text) {
                                    if(copyMode === 'json') {
                                        const newConfig: Matrix<Rgb> | MatrixConfig = JSON.parse(text)
                                        if(newConfig) {
                                            onChange({
                                                ...config,
                                                matrix: 'matrix' in newConfig ? newConfig.matrix : newConfig,
                                            })
                                        }
                                    } else if (copyMode === 'python') {
                                        const newConfig = fromPython(config, text)
                                        if(newConfig) {
                                            onChange(newConfig)
                                        }
                                    }
                                }
                            }}>
                                <ContentPaste />
                            </IconButton>
                        </Tooltip>
                        </div>
                        <Tooltip color="success" placement="top" title={state !== config ? 'Saving ...' : 'Saved'}>
                            <IconButton size="small" className="save-indicator" >
                                {
                                    state !== config ? <CircularProgress color="success" size={24} /> : <Check />
                                }
                            </IconButton>
                        </Tooltip>
                    </div>
                </Box>
                <TextField fullWidth label="Name" id={'matrix-card-name-' + config.id} type="text" value={name} onChange={(e) => update({ name: e.target.value ?? '' })} />
                <Box mx={2} my={2} />
                <NumberInput label="Height" id={'matrix-card-height-' + config.id} value={height} onChange={value => update({ height: value })} />
                <Box mx={2} my={2} />
                <NumberInput label="Width" id={'matrix-card-width-' + config.id} value={width} onChange={value => update({ width: value })} />
                <Box mx="auto" className={'pixels'} mt={2} onDragStart={e => e.preventDefault()}>
                    {Array.from(Array(height).keys()).map((iRow) => {
                        return (
                            <div key={iRow} style={{ textAlign: 'center', lineHeight: 0 }} onDragStart={e => e.preventDefault()}>
                                {Array.from(Array(width).keys()).map((iColumn) => {
                                    return (
                                        <Pixel
                                            key={iColumn}
                                            color={matrix[iRow]?.[iColumn]}
                                            emptyColor={emptyColor}
                                            x={iColumn}
                                            y={iRow}
                                            onChange={setPixel}
                                        />
                                    )
                                })}
                            </div>
                        )
                    })}
                </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'right' }}>
                <Button color="primary" className="copy" onClick={() => onCopy(config)}>Copy</Button>
                <Button className="fill" onClick={() => {
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
                <Button className="clear" color="primary" onClick={() => onChange({ ...config, matrix: {} })}>Clear</Button>
                <Button className="delete" color="primary" onClick={() => onDelete(config)}>Delete</Button>
            </CardActions>
        </Card>
    )
}))

type ColorPickerProps = {
    onChange: (value: Rgb) => void
    value: Rgb
}

function useKeypressListener(key: string, onReset: (clicked: false) => void) {
    const [state, setState] = useState(false)
    useEffect(() => {
        function downListener(e: KeyboardEvent) {
            if (!e.repeat && (e.key === key)) {
                setState(true)
            }
        }
        function upListener(e: KeyboardEvent) {
            if (!e.repeat && (e.key === key)) {
                setState(false)
                onReset(false)
            }
        }
        window.addEventListener('keydown', downListener)
        window.addEventListener('keyup', upListener)
        return () => {
            window.removeEventListener('keydown', downListener)
            window.removeEventListener('keyup', upListener)
        }
    }, [setState, key, onReset])
    return [state]
}
export function ColorPicker({ onChange, value }: ColorPickerProps) {
    const theme = useTheme()
    const [state, setState] = useState(value)
    const [pickColor, setPickColor] = usePickColor()
    const [clearMode, setClearMode] = useClearMode()
    const [shiftPressed] = useKeypressListener('Shift', setClearMode)

    useEffect(() => {
        document.getElementById('root')?.setAttribute('data-delete-cursor', String(clearMode || shiftPressed))
    }, [clearMode, shiftPressed])

    useEffect(() => {
        document.getElementById('root')?.setAttribute('data-pick-color-cursor', String(pickColor))
    }, [pickColor])

    useEffect(() => {
        setState(value)
    }, [value, setState])

    return (
        <Card id="color-picker">
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
            <CardActions sx={{ justifyContent: 'right' }}>
                <FormGroup>
                    <FormControlLabel
                        label="Delete Mode"
                        labelPlacement="start"
                        control={
                            <Tooltip placement="top" title="Toggle clear mode (you can also hold the shift key)">
                                <Switch
                                    checked={shiftPressed || clearMode}
                                    onChange={e => setClearMode(e.target.checked)}
                                    inputProps={{ 'aria-label': 'toggle-clear-mode' }}
                                />
                            </Tooltip>
                        }
                    />
                </FormGroup>
                <Tooltip placement="top" title="Color picker. Enable this and click a pixel to use its color">
                    <IconButton color={pickColor ? "secondary" : "primary"} onClick={() => setPickColor(!pickColor)}>
                        <Colorize />
                    </IconButton>
                </Tooltip>
            </CardActions>
        </Card>
    )
}
