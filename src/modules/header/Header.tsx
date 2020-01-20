import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import React, { useContext } from 'react';
import { AppStateContext, ViewMode } from '../../App';
import AddEndpoint from '../add-endpoint/AddEndpoint';

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
const viewModeButtonLabel: Record<ViewMode, string> = {
  panels: 'Tabs view',
  tabs: 'Panels view',
};

export default function Header() {
  const classes = useStyles();
  const { viewMode, changeViewMode } = useContext(AppStateContext);

  function handleViewModeToggle() {
    changeViewMode(viewMode === 'tabs' ? 'panels' : 'tabs');
  }

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography className={classes.title} variant="h6">
            Moxy Proxy
          </Typography>
          <Button onClick={handleViewModeToggle}>{viewModeButtonLabel[viewMode]}</Button>
          <AddEndpoint />
        </Toolbar>
      </AppBar>
    </div>
  );
}
