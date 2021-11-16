import { atom, useRecoilState } from "recoil";

export const ClearModeAtom = atom({
    key: "clearMode",
    default: false,
})

export function useClearMode() {
    return useRecoilState(ClearModeAtom)
}
