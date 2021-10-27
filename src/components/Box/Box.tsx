import React from 'react'

type Rgb = [number, number, number]

type BoxProps = {
    color: Rgb
    onChange: () => void
}

export function Box({ color, onChange }: BoxProps) {
    return (
        <div
            className="box"
            style={{ backgroundColor: `rgb(${color.join(',')})` }}
            onMouseEnter={onChange}
        />
    )
}