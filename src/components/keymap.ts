export const keymap = {
    lmb: false,
}

window.addEventListener('mousedown', () => keymap.lmb = true)
window.addEventListener('mouseup', () => keymap.lmb = false)
