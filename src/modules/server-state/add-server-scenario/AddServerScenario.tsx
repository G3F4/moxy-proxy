import { IconButton, Typography, useMediaQuery } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme,
} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { Close } from '@material-ui/icons';
import React, { ChangeEvent, useContext, useRef, useState } from 'react';
import { ServerState } from '../../../../sharedTypes';
import { AppStateContext } from '../../../App';
import { SimpleEditor } from '../../../common/SimpleEditor';

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

export default function AddServerScenario() {
  const [open, setOpen] = useState(false);
  const classes = useStyles();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));
  const { addServerStateScenario, serverState } = useContext(AppStateContext);
  const [scenarioServerState, setScenarioServerState] = useState(
    {} as ServerState,
  );
  const [name, setName] = useState('');
  const valueGetter = useRef<() => string>();
  const code = JSON.stringify(scenarioServerState, null, 2);

  function handleClickOpen() {
    setOpen(true);
    setScenarioServerState(serverState);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  async function handleSubmit() {
    if (valueGetter.current) {
      await addServerStateScenario({
        id: Date.now().toString(),
        name,
        state: JSON.parse(valueGetter.current()) as ServerState,
      });
      setOpen(false);
    }
  }

  return (
    <>
      <Button onClick={handleClickOpen}>Add server scenario</Button>
      <Dialog
        closeAfterTransition
        aria-labelledby="max-width-dialog-title"
        fullScreen={fullScreen}
        maxWidth="md"
        open={open}
        onClose={handleClose}
      >
        <DialogTitle
          disableTypography
          id="max-width-dialog-title"
          style={{ minWidth: 500 }}
        >
          <Typography variant="h6">Add server scenario</Typography>
          <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={handleClose}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            id="name"
            label="Scenario name"
            margin="dense"
            value={name}
            onChange={handleNameChange}
          />
        </DialogContent>
        <DialogContent>
          <DialogContentText>
            Modify copy of state before adding
          </DialogContentText>
          <SimpleEditor
            autoHeight
            initialCode={code}
            language="json"
            valueGetter={valueGetter}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
