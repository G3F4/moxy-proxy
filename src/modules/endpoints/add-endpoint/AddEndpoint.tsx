import { IconButton, Typography, useMediaQuery } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import { Close } from '@material-ui/icons';
import React, { useContext, useState } from 'react';
import { Endpoint } from '../../../../sharedTypes';
import { AppStateContext } from '../../../App';
import AddEndpointStepper from './AddEndpointStepper';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
  }),
);

export default function AddEndpoint() {
  const [open, setOpen] = useState(false);
  const classes = useStyles();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));
  const { addEndpoint } = useContext(AppStateContext);
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleDone = (endpoint: Endpoint) => {
    setOpen(false);
    addEndpoint(endpoint);
  };

  return (
    <div>
      <Button onClick={handleClickOpen}>Add endpoint</Button>
      <Dialog
        closeAfterTransition
        aria-labelledby="max-width-dialog-title"
        fullScreen={fullScreen}
        maxWidth="md"
        open={open}
        onClose={handleClose}
      >
        <DialogTitle disableTypography id="max-width-dialog-title" style={{ minWidth: 500 }}>
          <Typography variant="h6">Add endpoint</Typography>
          <IconButton aria-label="close" className={classes.closeButton} onClick={handleClose}>
            <Close />
          </IconButton>
        </DialogTitle>
        <AddEndpointStepper onDone={handleDone} />
      </Dialog>
    </div>
  );
}
