import React from 'react';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import AddRoute from '../add-route/AddRoute';
import {Route} from '../add-route/AddRouteStepper';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
      fontWeight: theme.typography.fontWeightRegular,
    },
  }),
);

export default function Routes({ routes }: { routes: Route[] }) {
  const classes = useStyles();
  
  return (
    <div className={classes.root}>
      <Typography variant="body1">Routes</Typography>
      {routes.length === 0 && (
        <>
          <Typography variant="caption">
            No route defined.
          </Typography>
          <AddRoute />
        </>
      )}
      {routes.map(({ url, method, serverStateUpdateCode, responseCode }) => (
        <ExpansionPanel key={`${url}:${method}`}>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography className={classes.heading}>
              {`${method}:${url}`}
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Typography>
              {responseCode}
            </Typography>
          </ExpansionPanelDetails>
          <ExpansionPanelDetails>
            <Typography>
              {serverStateUpdateCode}
            </Typography>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      ))}
    </div>
  );
}