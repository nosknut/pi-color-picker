import styled from '@mui/material/styles/styled'
import React from 'react'
import { keymap } from '../keymap'
export type Rgb = [number, number, number]

type PixelProps = {
    color: Rgb
    onChange: (clear: boolean) => void
}

const FancyDiv = styled('div')`
    :hover {
        border: 2px white solid;
    }
    display: inline-block;
    margin: 1px;
`

export function Pixel({ color, onChange }: PixelProps) {
    return (
        <FancyDiv
            onDragStart={e => e.preventDefault()}
            style={{
                backgroundColor: `rgb(${color.join(',')})`,
                width: 20,
                height: 20,
            }}
            onMouseEnter={(e) => {
                if (keymap.lmb) {
                    onChange(e.shiftKey)
                }
            }}
            onMouseDown={e => {
                onChange(e.shiftKey)
            }}
        />
    )
}