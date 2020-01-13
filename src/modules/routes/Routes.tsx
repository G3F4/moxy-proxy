import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import React from 'react';
import {Route} from '../../../sharedTypes';
import AddRoute from '../add-route/AddRoute';
import RouteCode from './RouteCode';

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
      <Typography variant="h5" style={{ margin: 8 }}>Routes</Typography>
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
              {`${method.toUpperCase()}: ${url}`}
            </Typography>
          </ExpansionPanelSummary>
          <RouteCode
            responseCode={responseCode}
            serverStateUpdateCode={serverStateUpdateCode}
          />
        </ExpansionPanel>
      ))}
    </div>
  );
}
