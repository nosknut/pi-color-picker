import { useCallback } from "react";
import { atom, useRecoilState, useSetRecoilState } from "recoil";

import { Rgb } from "../types/Rgb";
import { SelectedColorAtom } from "./SelectedColor";

export const PickColorAtom = atom({
    key: "pickColor",
    default: false,
})

export function usePickColor(): [boolean, (value: boolean) => void, (color: Rgb | null) => void] {
    const setSelectedColor = useSetRecoilState(SelectedColorAtom)
    const [pickColor, setPickColor] = useRecoilState(PickColorAtom)
    return [
        pickColor,
        setPickColor,
        useCallback((color) => {
            if (color) {
                setSelectedColor(color)
                setPickColor(false)
            }
        }, [setSelectedColor, setPickColor]),
    ]
}
