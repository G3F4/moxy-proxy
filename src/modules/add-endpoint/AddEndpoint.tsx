import { useMediaQuery } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import { useTheme } from '@material-ui/core/styles';
import React, { useContext } from 'react';
import { Endpoint } from '../../../sharedTypes';
import { AppStateContext } from '../../App';
import AddEndpointStepper from './AddEndpointStepper';

export default function AddEndpoint() {
  const [open, setOpen] = React.useState(false);
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
        <DialogTitle id="max-width-dialog-title">Add endpoint</DialogTitle>
        <AddEndpointStepper onDone={handleDone} />
      </Dialog>
    </div>
  );
}
