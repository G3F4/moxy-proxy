import { FormControl } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppStateContext, ViewMode } from '../../App';
import Menu from '@material-ui/core/Menu';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import IconButton from '@material-ui/core/IconButton';

// function ResetAllDataConfirmDialog() {
//   const [open, setOpen] = React.useState(false);
//   const theme = useTheme();
//   const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
//   const handleClickOpen = () => {
//     setOpen(true);
//   };
//   const handleClose = () => {
//     setOpen(false);
//   };
//   const { persistEndpoints } = useContext(AppStateContext);
//
//   function handleConfirm() {
//     persistEndpoints();
//     handleClose();
//   }
//
//   return (
//     <>
//       <span onClick={handleClickOpen}>Reset all data</span>
//       <Dialog
//         fullScreen={fullScreen}
//         open={open}
//         onClose={handleClose}
//         aria-labelledby="responsive-dialog-title"
//       >
//         <DialogTitle id="responsive-dialog-title">
//           You are deleting all data changes
//         </DialogTitle>
//         <DialogActions>
//           <Button autoFocus onClick={handleConfirm} color="secondary">
//             Confirm reset all data
//           </Button>
//           <Button onClick={handleClose} color="primary" autoFocus>
//             Cancel
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </>
//   );
// }

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
  }),
);
const viewModeOptions: Record<ViewMode, string> = {
  panels: 'Panels view',
  tabs: 'Tabs view',
  board: 'Board view',
};

export default function Header() {
  const classes = useStyles();
  const {
    viewMode,
    activeServerStateScenarioId,
    serverStateScenarios,
    changeServerStateScenario,
    changeViewMode,
    persistMockedData,
    persistEndpoints,
  } = useContext(AppStateContext);
  const inputLabel = useRef<HTMLLabelElement>(null);
  const [labelWidth, setLabelWidth] = useState(0);
  const [anchorEl, setAnchorEl] = React.useState(null);
  // @ts-ignore
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  function handlePersistMockedData() {
    handleClose();
    persistMockedData();
  }

  function handlePersistEndpoints() {
    handleClose();
    persistEndpoints();
  }

  useEffect(() => {
    setLabelWidth(inputLabel.current!.offsetWidth);
  }, []);

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography className={classes.title} variant="h6">
            Moxy Proxy
          </Typography>
          <FormControl
            style={{
              margin: 8,
              minWidth: 120,
            }}
            variant="outlined"
          >
            <InputLabel id="view-mode-select" ref={inputLabel}>
              View mode
            </InputLabel>
            <Select
              labelId="view-mode-select"
              labelWidth={labelWidth}
              value={viewMode}
              onChange={(event) => {
                changeViewMode(event.target.value as ViewMode);
              }}
            >
              {Object.keys(viewModeOptions).map(key => (
                <MenuItem key={key} value={key}>
                  {viewModeOptions[key as ViewMode]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            style={{
              margin: 8,
              minWidth: 120,
            }}
            variant="outlined"
          >
            <InputLabel id="state-scenario-select" ref={inputLabel}>
              State scenario
            </InputLabel>
            <Select
              labelId="state-scenario-select"
              labelWidth={labelWidth}
              value={activeServerStateScenarioId}
              onChange={(event) => {
                changeServerStateScenario(event.target.value as string);
              }}
            >
              {serverStateScenarios.map(({ id, name }) => (
                <MenuItem key={id} value={id}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton
            aria-controls="admin-menu"
            aria-haspopup="true"
            aria-label="admin menu"
            onClick={handleClick}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            keepMounted
            anchorEl={anchorEl}
            id="admin-menu"
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handlePersistMockedData}>
              Persist mocked data
            </MenuItem>
            <MenuItem onClick={handlePersistEndpoints}>
              Persist endpoints changes
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </div>
  );
}
