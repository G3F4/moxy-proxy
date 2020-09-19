import { Button } from '@material-ui/core';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useContext } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  Endpoint as EndpointInterface,
  HttpStatus,
  HttpStatusOption,
} from '../../../sharedTypes';
import { AppStateContext } from '../../App';
import { httpStatuses } from '../../common/httpStatuses';
import TestEndpoint from './test-endpoint/TestEndpoint';
import EndpointCode from './EndpointCode';

const httpStatusOptions: HttpStatusOption[] = Object.keys(httpStatuses).map(
  key => ({
    value: (key as unknown) as HttpStatus,
    text: httpStatuses[(key as unknown) as HttpStatus],
  }),
);
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    heading: {
      fontSize: theme.typography.pxToRem(15),
      fontWeight: theme.typography.fontWeightRegular,
    },
  }),
);

export default function Endpoint({
  endpoint,
}: {
  endpoint: EndpointInterface;
}) {
  const classes = useStyles();
  const {
    updateEndpoint,
    deleteEndpoint,
    changeEndpointResponseStatus,
  } = useContext(AppStateContext);

  return (
    <>
      <ExpansionPanelDetails
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignContent: 'center',
        }}
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
      <ExpansionPanelDetails
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {endpoint.parameters.length > 0 && (
          <>
            <Typography
              className={classes.heading}
              style={{ marginBottom: 16 }}
            >
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
    </>
  );
}
