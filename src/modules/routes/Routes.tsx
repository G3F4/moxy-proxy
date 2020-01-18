import { Button } from "@material-ui/core";
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import React, { useContext } from 'react';
import { Route } from '../../../sharedTypes';
import { AppStateContext } from '../../App';
import AddRoute from '../add-route/AddRoute';
import TestRoute from "../test-route/TestRoute";
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
  const { updateRoute, deleteRoute } = useContext(AppStateContext);

  return (
    <div className={classes.root}>
      <Typography style={{ margin: 8 }} variant="h5">Routes</Typography>
      {routes.length === 0 && (
        <>
          <Typography variant="caption">
            No route defined.
          </Typography>
          <AddRoute />
        </>
      )}
      {routes.map(route => (
        <ExpansionPanel key={route.id}>
          <ExpansionPanelSummary
            aria-controls="panel1a-content"
            expandIcon={<ExpandMoreIcon />}
            id="panel1a-header"
          >
            <Typography className={classes.heading}>
              {`${route.method.toUpperCase()}: ${route.url}`}
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Button onClick={() => deleteRoute(route.id)}>Delete</Button>
            <TestRoute route={route} />
          </ExpansionPanelDetails>
          <RouteCode
            responseCode={route.responseCode}
            serverStateUpdateCode={route.serverStateUpdateCode}
            onResponseCodeSave={(code: string) => {
              updateRoute({
                id: route.id,
                url: route.url,
                method: route.method,
                responseCode: code,
                serverStateUpdateCode: route.serverStateUpdateCode,
              })
            }}
            onServerStateUpdateCodeSave={(code: string) => {
              updateRoute({
                id: route.id,
                url: route.url,
                method: route.method,
                responseCode: route.responseCode,
                serverStateUpdateCode: code,
              })
            }}
          />
        </ExpansionPanel>
      ))}
    </div>
  );
}
