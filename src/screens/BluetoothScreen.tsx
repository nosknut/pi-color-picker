import { Button, Card, CardActions, CardHeader, Grid, List, ListItem, ListItemText, Toolbar } from '@mui/material';
import React from 'react';

export function BluetoothScreen() {
    const devices: Array<any> = []

    return (
        <>
            <Toolbar sx={{ marginTop: 1 }}>
            </Toolbar>
            <main style={{ marginBottom: "200px" }}>
                <Grid mt={2} container justifyContent="center" direction="row" spacing={2}>
                    <Grid item>
                        <Card sx={{ paddingX: 2 }}>
                            <CardHeader title="Select device" />
                            <List>
                                {!devices.length && <ListItem><ListItemText primary="No devices found" /></ListItem>}
                                {devices.map(device => {
                                    return (
                                        <ListItem>

                                        </ListItem>
                                    )
                                })}
                            </List>
                            <CardActions>
                                <Button
                                    color="primary"
                                    onClick={() => {
                                        //@ts-ignore
                                        if (!navigator.bluetooth) {
                                            alert('No support for bluetooth on this device')
                                        }
                                        //@ts-ignore
                                        navigator.bluetooth?.requestDevice({
                                            acceptAllDevices: true,
                                        }).then(console.log)
                                    }}
                                >Search</Button>
                            </CardActions>
                        </Card>
                    </Grid>
                </Grid>
            </main>
        </>
    );
}
