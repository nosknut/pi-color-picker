import styled from '@mui/material/styles/styled'
import React from 'react'
import { Rgb } from '../../types/Rgb'
import { keymap } from '../keymap'


type PixelProps = {
    color: Rgb | null
    emptyColor: Rgb
    onChange: (x: number, y: number, clear: boolean, color: Rgb | null) => void
    x: number
    y: number
}

const FancyDiv = styled('div')`
    :hover {
        border: 2px white solid;
    }
    display: inline-block;
    margin: 1px;
    cursor: inherit;
`

export const Pixel = React.memo(({ color, emptyColor, onChange, x, y }: PixelProps) => {
    return (
        <FancyDiv
            onDragStart={e => e.preventDefault()}
            style={{
                backgroundColor: `rgb(${(color || emptyColor).join(',')})`,
                width: 20,
                height: 20,
            }}
            onMouseEnter={(e) => {
                if (keymap.lmb) {
                    onChange(x, y, e.shiftKey, color)
                }
            }}
            onMouseDown={e => {
                onChange(x, y, e.shiftKey, color)
            }}
        />
    )
})