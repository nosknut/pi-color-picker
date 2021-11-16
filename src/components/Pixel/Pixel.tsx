import styled from '@mui/material/styles/styled'
import React from 'react'
import { useClearMode } from '../../atoms/ClearMode'

import { usePickColor } from '../../atoms/PickColor'
import { Rgb } from '../../types/Rgb'
import { keymap } from '../keymap'

type PixelProps = {
    color: Rgb | null
    emptyColor: Rgb
    onChange: (clear: boolean) => void
}

const FancyDiv = styled('div')`
    :hover {
        border: 2px white solid;
    }
    display: inline-block;
    margin: 1px;
    cursor: inherit;
`

export function Pixel({ color, emptyColor, onChange }: PixelProps) {
    const [clearMode] = useClearMode()
    const [pickColor, , setColor] = usePickColor()
    const onClick = (clear: boolean) => {
        if (pickColor) {
            setColor(color)
        } else {
            onChange(clear || clearMode)
        }
    }
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
                    onClick(e.shiftKey)
                }
            }}
            onMouseDown={e => {
                onClick(e.shiftKey)
            }}
        />
    )
}