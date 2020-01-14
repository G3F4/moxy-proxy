import {useMediaQuery} from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import {useTheme} from '@material-ui/core/styles';
import React, {useContext} from 'react';
import {Route} from '../../../sharedTypes';
import {AppStateContext} from '../../App';
import AddRouteStepper from './AddRouteStepper';

export default function AddRoute() {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));
  const { addRoute } = useContext(AppStateContext);
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleDone = (route: Route) => {
    setOpen(false);
    addRoute(route);
  };
  
  return  (
    <div>
      <Button onClick={handleClickOpen}>
        Add route
      </Button>
      <Dialog
        closeAfterTransition
        aria-labelledby="max-width-dialog-title"
        fullScreen={fullScreen}
        maxWidth="md"
        open={open}
        onClose={handleClose}
      >
        <DialogTitle id="max-width-dialog-title">Add route</DialogTitle>
        <AddRouteStepper onDone={handleDone} />
      </Dialog>
    </div>
  );
}