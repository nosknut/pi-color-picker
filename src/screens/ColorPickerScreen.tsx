import { Add, Check, Close, ContentCopy, Error, Help } from '@mui/icons-material';
import { Alert, Button, Card, CardActions, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, FormControl, FormControlLabel, FormLabel, Grid, IconButton, Radio, RadioGroup, Snackbar, Switch, TextField, Toolbar, Tooltip } from '@mui/material';
import useLocalStorage from '@rehooks/local-storage';
import copy from 'clipboard-copy';
import { Step, Steps } from 'intro.js-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable from 'react-draggable';

import { useSelectedColor } from '../atoms/SelectedColor';
import { ColorPicker, CopyMode, MatrixCard, MatrixConfig } from '../components/MatrixCard';
import { useDarkMode } from '../components/Pixel/Themes';
import { GRAY, LIGHT_GRAY } from '../constants/Colors';
import { useImperativeState } from '../hooks/useImperativeState';
import { useTutorial } from '../hooks/useTutorial';

function useStateHistory<T>(value: T) {
    const [historyIndex, setHistoryIndex] = useState<number>(0)
    const [history] = useState<{ values: T[] }>({ values: [value] })
    const newest = history.values[history.values.length - 1]

    useEffect(() => {
        if (value !== newest) {
            history.values = [...history.values.slice(0, historyIndex + 1), value]
            setHistoryIndex(history.values.length - 1)
        }
    }, [value, newest, history, setHistoryIndex, historyIndex])

    useEffect(() => {
        function listener(e: KeyboardEvent) {
            if (e.ctrlKey && (e.code === 'KeyZ')) {
                setHistoryIndex(Math.max(0, historyIndex - 1))
            }
            if (e.ctrlKey && (e.code === 'KeyY')) {
                setHistoryIndex(Math.min(history.values.length - 1, historyIndex + 1))
            }
        }
        window.addEventListener('keypress', listener)
        return () => {
            window.removeEventListener('keypress', listener)
        }
    }, [setHistoryIndex, historyIndex, history])

    return [
        value === newest ? history.values[historyIndex] : value,
    ]
}

function makeSteps(lastMatrixId: string): Step[] {
    const lastId = lastMatrixId.replace('.', '\\.')
    return [
        { element: "#toggle-tutorial-btn", intro: 'Toggle Tutorial' },
        { element: "#change-theme-btn", intro: 'Toggle Dark Mode' },
        { element: "#add-matrix-btn", intro: 'Create a new matrix' },
        { element: "#matrix-card-name-" + lastId, intro: 'Set the name of your matrix. This will be used when generating code' },
        { element: "#matrix-card-height-" + lastId, intro: 'Set the pixel height of your matrix' },
        { element: "#matrix-card-height-" + lastId + '-save', intro: 'Click the save button when you have set a new height' },
        { element: "#matrix-card-width-" + lastId, intro: 'Set the pixel width of your matrix' },
        { element: "#matrix-card-width-" + lastId + '-save', intro: 'Click the save button when you have set a new width' },
        { element: "#color-picker", intro: 'Pick a color you like' },
        { element: "#matrix-card-" + lastId + ' .pixels', intro: 'Start drawing something! Click a pixel, or hold the left mouse button while draging to draw with your selected color. Hold shift to remove the color from a pixel' },
        { element: "#matrix-card-" + lastId + ' .save-indicator', intro: 'Your work is saved 1sec after you stop changing things' },
        { element: "#matrix-card-" + lastId + ' .copy', intro: 'Copy the matrix' },
        { element: "#matrix-card-" + lastId + ' .clear', intro: 'Clear the matrix content' },
        { element: "#matrix-card-" + lastId + ' .fill', intro: 'Fill the matrix with the selected color' },
        { element: "#copy-mode-form", intro: 'Select the export format' },
        { element: "#matrix-card-" + lastId + ' .copy-code', intro: 'Copy the code to your clipboard' },
        { element: "#matrix-card-" + lastId + ' .copy-code', intro: 'Now paste the code into your editor and watch the magic ;)' },
        { element: "#matrix-card-" + lastId + ' .copy', intro: 'Make another copy' },
        { element: "#matrix-card-" + lastId + ' .delete', intro: 'Now delete this matrix' },
        { intro: 'All set! Happy coding :)' },
    ]
}

const PI_SETUP_COMMAND = "sudo curl https://pi-color-picker.web.app/install-pi-server.sh | sudo bash"
function PiSetupModal({ open, close }: { open: boolean, close: () => void }) {
    return (
        <Dialog
            open={open}
            onClose={() => close()}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {"Set up PI for realtime updates"}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description" sx={{ whiteSpace: 'pre-wrap' }}>
                    {`This app is able to send http requests to your rapsberry pi,
which will let the changes you make in this website be immedietly
reflected on the physical unit.

To use this feature, you must set the PI Url in the textbox to the top
right of the page, to the full URL of your Raspberry PI.

The address will likely look like this:
http://piename.is-very-sweet.org:5000/pattern

When this is done, it's time to install the rest-api on the raspberry pi.
To do this, run the following command:
        `}
                    <Card>
                        <CardContent>
                            {PI_SETUP_COMMAND}
                        </CardContent>
                        <CardActions>
                            <Tooltip placement="top" title="Copy install command to clipboard">
                                <IconButton color="primary" className="copy-install-command" size="small" onClick={() => copy(PI_SETUP_COMMAND)}>
                                    <ContentCopy />
                                </IconButton>
                            </Tooltip>
                        </CardActions>
                    </Card>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => close()} autoFocus>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>
    )
}

async function updatePi(url: string, matrix: MatrixConfig) {
    if (!url) {
        return
    }
    await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix }),
    })
}

export function ColorPickerTutorialButton() {
    const [tutorial, setTutorial] = useTutorial()
    return (
        <IconButton id="toggle-tutorial-btn" style={{ color: 'white' }} onClick={() => setTutorial({ ...tutorial, show: true })}>
            <Help />
        </IconButton>
    )
}

export function ColorPickerScreen() {
    const [copyMode, setCopyMode] = useState<CopyMode>('json')
    const [darkMode] = useDarkMode()
    const [selectedColor, setSelectedColor] = useSelectedColor()
    const [stored, setMatrixes] = useLocalStorage<{ [id: string]: MatrixConfig }>('matrixes', {})
    const emptyColor = darkMode ? GRAY : LIGHT_GRAY
    const [matrixes] = useStateHistory(stored)
    const [tutorial, setTutorial] = useTutorial()
    const lastId = useMemo(() => {
        const [, lastId] = Object.values(matrixes).reduce(([timestamp, id], mat) => mat.created > timestamp ? [mat.created, mat.id] : [timestamp, id], ['', ''])
        return lastId

    }, [matrixes])
    const lastRef = useRef<any>()
    const [scrollTo, setScrollTo] = useState('')
    const [updatePiSettings, setUpdatePiSettings] = useLocalStorage<{ url: string, enableUpdatePi: boolean }>('UPDATE_PI_SETTINGS', { url: '', enableUpdatePi: true })
    const [error, setError] = useState('')
    const [showSnackbar, setShowSnackbar] = useState(false)
    const [updatingPi, setUpdatingPi] = useState(false)
    const [showPiSetupModal, setShowPiSetupModal] = useState(false)

    useEffect(() => {
        if (scrollTo === lastId) {
            lastRef.current?.scrollIntoView?.({ behavior: 'smooth' })
        }
    }, [scrollTo, lastId, lastRef])

    const imperativeState = useImperativeState({
        setMatrixes,
        setScrollTo,
        setTutorial,
        tutorial,
        matrixes,
        updatePiSettings,
    })

    const copyMatrix = useCallback((matrix) => {
        const { setMatrixes, setScrollTo, setTutorial, tutorial, matrixes } = imperativeState.current
        const id = Math.random().toString()
        setMatrixes({
            ...matrixes,
            [id]: {
                ...matrix,
                id,
                created: new Date().toISOString(),
            },
        })
        setScrollTo(id)
        if (tutorial.show) {
            setTutorial({ ...tutorial, show: false })
            setTimeout(() => {
                setTutorial({ step: tutorial.step + 1, show: true })
            }, 10)
        }
    }, [imperativeState])

    const updateMatrix = useCallback(value => {
        const { setMatrixes, matrixes, updatePiSettings } = imperativeState.current
        if (updatePiSettings.enableUpdatePi) {
            setError('')
            setUpdatingPi(true)
            setShowSnackbar(false)
            updatePi(updatePiSettings.url, value)
                .catch(e => {
                    console.error(e)
                    setError(e.message)
                    setShowSnackbar(true)
                })
                .finally(() => setUpdatingPi(false))
        }
        setMatrixes({
            ...matrixes,
            [value.id]: value,
        })
    }, [imperativeState])

    const deleteMatrix = useCallback((matrix: MatrixConfig) => {
        const { setMatrixes, matrixes, tutorial, setTutorial } = imperativeState.current
        const { [matrix.id]: current, ...others } = matrixes
        setMatrixes(others)
        if (tutorial.show) {
            setTutorial({ ...tutorial, show: false })
            setTimeout(() => {
                setTutorial({ step: tutorial.step + 1, show: true })
            }, 10)
        }
    }, [imperativeState])

    return (
        <>
            <Steps
                enabled={tutorial.show}
                initialStep={tutorial.step || 0}
                steps={useMemo(() => makeSteps(lastId), [lastId])}
                onExit={(step) => setTutorial({ show: false, step })}
                onComplete={() => setTutorial({ show: false, step: 0 })}
                onChange={(step) => setTutorial({ ...tutorial, step })}
                options={{
                    disableInteraction: false,
                    showProgress: true,
                    showStepNumbers: true,
                }}
            />
            <Toolbar sx={{ marginTop: 1 }}>
                <Grid container alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <FormControl component="fieldset" id="copy-mode-form">
                            <FormLabel component="span">Copy as</FormLabel>
                            <RadioGroup
                                row
                                aria-label="copyMode"
                                name="controlled-radio-buttons-group"
                                value={copyMode}
                                onChange={e => setCopyMode(e.target.value as CopyMode)}
                            >
                                <FormControlLabel value="json" control={<Radio />} label="Json" />
                                <FormControlLabel value="python" control={<Radio />} label="Python" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm>
                        <TextField
                            fullWidth
                            variant="standard"
                            placeholder="PI Url"
                            value={updatePiSettings.url}
                            onChange={e => setUpdatePiSettings({ ...updatePiSettings, url: e.target.value || '' })}
                            InputProps={{
                                startAdornment: (
                                    <Tooltip placement="top" title="Enable/Disable sending updates to this URL">
                                        <Switch
                                            checked={updatePiSettings.enableUpdatePi}
                                            onChange={e => setUpdatePiSettings({ ...updatePiSettings, enableUpdatePi: !!e.target.checked })}
                                            inputProps={{ 'aria-label': 'toggle-enable-update-pi' }}
                                        />
                                    </Tooltip>
                                ),
                                endAdornment: (
                                    <>
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => setShowPiSetupModal(true)}
                                        >
                                            <Help />
                                        </IconButton>
                                        <Tooltip color={error ? "error" : "success"} placement="top" title={updatingPi ? 'Sending changes to PI ...' : (error ? ('Error: ' + error) : 'PI is updated')}>
                                            <IconButton size="small" className="save-indicator" >
                                                {
                                                    updatingPi ? <CircularProgress color="success" size={24} /> : (error ? <Error /> : <Check />)
                                                }
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )
                            }}
                        />
                    </Grid>
                </Grid>
                <Snackbar
                    open={!!(showSnackbar && error)}
                    autoHideDuration={6000}
                    onClose={() => setShowSnackbar(false)}
                    message={error}
                    action={(
                        <>
                            <IconButton
                                size="small"
                                aria-label="close"
                                color="inherit"
                                onClick={() => setShowSnackbar(false)}
                            >
                                <Close fontSize="small" />
                            </IconButton>
                        </>
                    )}
                >
                    <Alert severity="error" onClose={() => setShowSnackbar(false)}>{error}</Alert>
                </Snackbar>
                <PiSetupModal open={showPiSetupModal} close={() => setShowPiSetupModal(false)} />
            </Toolbar>
            <div id="add-matrix-btn" style={{ zIndex: 1200, position: 'fixed', bottom: 20, right: 20 }}>
                <Tooltip title="Add Matrix" placement="top">
                    <Fab
                        color="primary"
                        onClick={() => {
                            const id = Math.random().toString()
                            setMatrixes({
                                ...matrixes,
                                [id]: {
                                    id,
                                    name: '',
                                    created: new Date().toISOString(),
                                    width: 8,
                                    height: 8,
                                    matrix: {}
                                }
                            })
                            setScrollTo(id)
                            if (tutorial.show) {
                                setTutorial({ ...tutorial, show: false })
                                setTimeout(() => {
                                    setTutorial({ step: tutorial.step + 1, show: true })
                                }, 10)
                            }
                        }}
                    >
                        <Add />
                    </Fab>
                </Tooltip>
            </div>
            <main style={{ marginBottom: "200px" }}>
                <Grid mt={2} container justifyContent="center" direction="row" spacing={2}>
                    <Grid item>
                        <Draggable>
                            <ColorPicker value={selectedColor} onChange={setSelectedColor} />
                        </Draggable>
                    </Grid>
                    {Object.values(matrixes).map(matrix => {
                        return (
                            <Grid key={matrix.id} item>
                                <MatrixCard
                                    ref={lastRef}
                                    copyMode={copyMode}
                                    emptyColor={emptyColor}
                                    config={matrix}
                                    selectedColor={selectedColor}
                                    onDelete={deleteMatrix}
                                    onCopy={copyMatrix}
                                    onChange={updateMatrix}
                                />
                            </Grid>
                        )
                    })}
                </Grid>
            </main>
        </>
    );
}
