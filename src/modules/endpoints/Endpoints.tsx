import { Button } from '@material-ui/core';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import React, { useContext } from 'react';
import { Endpoint } from '../../../sharedTypes';
import { AppStateContext } from '../../App';
import AddEndpoint from '../add-endpoint/AddEndpoint';
import TestEndpoint from '../test-endpoint/TestEndpoint';
import EndpointCode from './EndpointCode';

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

export default function Endpoints({ endpoints }: { endpoints: Endpoint[] }) {
  const classes = useStyles();
  const { updateEndpoint, deleteEndpoint } = useContext(AppStateContext);

  return (
    <div className={classes.root}>
      <Typography style={{ margin: 8 }} variant="h5">
        Endpoints
      </Typography>
      {endpoints.length === 0 && (
        <>
          <Typography variant="caption">No endpoint defined.</Typography>
          <AddEndpoint />
        </>
      )}
      {endpoints.map(endpoint => (
        <ExpansionPanel key={endpoint.id}>
          <ExpansionPanelSummary
            aria-controls="panel1a-content"
            expandIcon={<ExpandMoreIcon />}
            id="panel1a-header"
          >
            <Typography className={classes.heading}>
              {`${endpoint.method.toUpperCase()}: ${endpoint.url}`}
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Button onClick={() => deleteEndpoint(endpoint.id)}>Delete</Button>
            <TestEndpoint endpoint={endpoint} />
          </ExpansionPanelDetails>
          <EndpointCode
            responseCode={endpoint.responseCode}
            serverStateUpdateCode={endpoint.serverStateUpdateCode}
            onResponseCodeSave={(code: string) => {
              updateEndpoint({
                id: endpoint.id,
                url: endpoint.url,
                method: endpoint.method,
                responseCode: code,
                serverStateUpdateCode: endpoint.serverStateUpdateCode,
              });
            }}
            onServerStateUpdateCodeSave={(code: string) => {
              updateEndpoint({
                id: endpoint.id,
                url: endpoint.url,
                method: endpoint.method,
                responseCode: endpoint.responseCode,
                serverStateUpdateCode: code,
              });
            }}
          />
        </ExpansionPanel>
      ))}
    </div>
  );
}
