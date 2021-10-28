import { Check, ContentCopy, Save } from '@mui/icons-material';
import { Box, Button, Card, CardActions, CardContent, CardHeader, CircularProgress, IconButton, TextField, Tooltip, useTheme } from '@mui/material';
import copy from 'clipboard-copy';
import _ from 'lodash';
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { SketchPicker } from 'react-color';
import { Pixel, Rgb } from './Pixel/Pixel';

export type Matrix<T> = {
    [y: number]: {
        [x: number]: T
    }
}

export const BLACK: Rgb = [0, 0, 0]
export const LIGHT_GRAY: Rgb = [200, 200, 200]
export const GRAY: Rgb = [100, 100, 100]
export const DEFAULT_COLOR: Rgb = [80, 150, 180]

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
    onDelete: () => void
    onCopy: () => void
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

export const MatrixCard = forwardRef(({ config, onChange, onDelete, onCopy, selectedColor, emptyColor, copyMode }: MatrixCardProps, ref) => {
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
        <Card elevation={2} id={"matrix-card-" + config.id} ref={ref as any}>
            <CardContent>
                <Box mb={1}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                        <Tooltip placement="top" title="Copy to clipboard">
                            <IconButton color="primary" className="copy-code" size="small" onClick={() => copy(copyMode === 'json' ? JSON.stringify(config, null, 2) : pythonFrom(config))}>
                                <ContentCopy />
                            </IconButton>
                        </Tooltip>
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
                <Button color="primary" className="copy" onClick={onCopy}>Copy</Button>
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
                <Button className="delete" color="primary" onClick={onDelete}>Delete</Button>
            </CardActions>
        </Card>
    )
})

type ColorPickerProps = {
    onChange: (value: Rgb) => void
    value: Rgb
}

export function ColorPicker({ onChange, value }: ColorPickerProps) {
    const theme = useTheme()
    const [state, setState] = useState(value)

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
        </Card>
    )
}
