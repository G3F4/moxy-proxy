import { Paper } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import React, { useContext } from 'react';
import { AppStateContext } from '../../App';
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

export default function Header() {
  const classes = useStyles();
  const { activeTab, changeActiveTab } = useContext(AppStateContext);
  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    changeActiveTab(newValue);
  };

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography className={classes.title} variant="h6">
            Moxy Proxy
          </Typography>
          <AddEndpoint />
        </Toolbar>
      </AppBar>
      <Paper className={classes.root}>
        <Tabs
          centered
          indicatorColor="primary"
          textColor="primary"
          value={activeTab}
          onChange={handleChange}
        >
          <Tab label="State interface" />
          <Tab label="Server state" />
          <Tab label="Endpoints" />
        </Tabs>
      </Paper>
    </div>
  );
}
