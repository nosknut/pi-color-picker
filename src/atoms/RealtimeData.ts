import { atom, useRecoilState } from "recoil";

import { SensorData } from "../screens/SensorScreen";

export const RealtimeDataAtom = atom<SensorData | null>({
    key: "realtimeData",
    default: null,
})

export function useRealtimeData() {
    return useRecoilState(RealtimeDataAtom)
}
