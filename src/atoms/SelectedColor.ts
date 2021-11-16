import { atom, useRecoilState } from "recoil";

import { DEFAULT_COLOR } from "../constants/Colors";

export const SelectedColorAtom = atom({
    key: "selectedColor",
    default: DEFAULT_COLOR,
})

export function useSelectedColor() {
    return useRecoilState(SelectedColorAtom)
}
