import { Button } from '@material-ui/core';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useContext } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { HttpStatus, HttpStatusOption } from '../../../sharedTypes';
import { AppStateContext } from '../../App';
import { httpStatuses } from '../../common/httpStatuses';
import AddEndpoint from '../add-endpoint/AddEndpoint';
import TestEndpoint from '../test-endpoint/TestEndpoint';
import EndpointCode from './EndpointCode';

const httpStatusOptions: HttpStatusOption[] = Object.keys(httpStatuses).map(key => ({
  value: (key as unknown) as HttpStatus,
  text: httpStatuses[(key as unknown) as HttpStatus],
}));
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

export default function Endpoints() {
  const classes = useStyles();
  const { endpoints, updateEndpoint, deleteEndpoint, changeEndpointResponseStatus } = useContext(
    AppStateContext,
  );

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
          <ExpansionPanelDetails
            style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
              <Button onClick={() => deleteEndpoint(endpoint.id)}>Delete</Button>
              <TestEndpoint endpoint={endpoint} />
            </div>
            <div>
              <Autocomplete
                getOptionLabel={option => `${option.value} ${option.text}`}
                options={httpStatusOptions}
                renderInput={params => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Select server suspense status"
                    variant="standard"
                  />
                )}
                style={{ width: 300 }}
                value={
                  {
                    text: endpoint.responseStatus
                      ? httpStatuses[endpoint.responseStatus]
                      : 'default',
                    value: endpoint.responseStatus || 200,
                  } as any
                }
                onChange={
                  ((_event: any, option: HttpStatusOption) =>
                    changeEndpointResponseStatus(endpoint.id, option.value)) as any
                }
              />
            </div>
          </ExpansionPanelDetails>
          <EndpointCode
            responseCode={endpoint.responseCode}
            serverStateUpdateCode={endpoint.serverStateUpdateCode}
            onResponseCodeSave={(code: string) => {
              updateEndpoint({
                id: endpoint.id,
                url: endpoint.url,
                method: endpoint.method,
                responseStatus: endpoint.responseStatus,
                responseCode: code,
                serverStateUpdateCode: endpoint.serverStateUpdateCode,
                parameters: endpoint.parameters,
              });
            }}
            onServerStateUpdateCodeSave={(code: string) => {
              updateEndpoint({
                id: endpoint.id,
                url: endpoint.url,
                method: endpoint.method,
                responseStatus: endpoint.responseStatus,
                responseCode: endpoint.responseCode,
                serverStateUpdateCode: code,
                parameters: endpoint.parameters,
              });
            }}
          />
          <ExpansionPanelDetails style={{ display: 'flex', flexDirection: 'column' }}>
            {endpoint.parameters.length > 0 && (
              <>
                <Typography className={classes.heading} style={{ marginBottom: 16 }}>
                  Parameters
                </Typography>
                <SyntaxHighlighter language="json">
                  {JSON.stringify(
                    endpoint.parameters.reduce(
                      (acc, { name, type }) => ({ ...acc, [name]: type }),
                      {},
                    ),
                    null,
                    2,
                  )}
                </SyntaxHighlighter>
              </>
            )}
          </ExpansionPanelDetails>
        </ExpansionPanel>
      ))}
    </div>
  );
}
