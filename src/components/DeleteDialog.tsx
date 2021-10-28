import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import * as React from 'react';

export type DeleteDialogProps = {
    label?: string
    title?: string
    children?: React.ReactNode
    onDelete: () => void
}

export function DeleteDialog({ label = "Delete", title = "Are you sure", children, onDelete }: DeleteDialogProps) {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleDelete = () => {
        handleClose()
        onDelete()
    };

    return (
        <>
            <Button color="secondary" onClick={handleClickOpen}>
                {label}
            </Button>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {title}
                </DialogTitle>
                <DialogContentText id="alert-dialog-description" sx={{ paddingRight: 2, paddingLeft: 2 }}>
                    You can not regret this action
                </DialogContentText>
                {children}
                <DialogActions>
                    <Button color="secondary" onClick={handleClose}>No</Button>
                    <Button onClick={handleDelete} autoFocus>
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
