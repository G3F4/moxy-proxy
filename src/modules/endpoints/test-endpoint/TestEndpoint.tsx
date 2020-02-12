import { IconButton, useMediaQuery } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Close } from '@material-ui/icons';
import React, { useContext, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Endpoint, EndpointParameter } from '../../../../sharedTypes';
import { AppStateContext } from '../../../App';
import CodeEditor from '../../../common/CodeEditor';
import CopyCurl from './CopyCurl';
import QueryParameters from './QueryParameters';
import UrlParameters from './UrlParameters';

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
const emptyJsonString = `
{}
`;

export const urlDelimiter = ':';

function getUrlParameters(url: string): Record<string, string> {
  const parts = url.split('/').filter(Boolean);

  return parts.reduce((acc, part) => {
    if (part[0] === urlDelimiter) {
      return {
        ...acc,
        [part.slice(1)]: '',
      };
    }

    return acc;
  }, {} as Record<string, string>);
}

function initialQueryParamsValues(queryParams: EndpointParameter[]): Record<string, string> {
  return queryParams.reduce(
    (acc, queryParam) => ({
      ...acc,
      [queryParam.name]: '',
    }),
    {},
  );
}

export default function TestEndpoint({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);
  const [requestBody, setRequestBody] = useState(emptyJsonString);
  const [showRequestBody, setShowRequestBody] = useState(false);
  const [responseJson, setResponseJson] = useState('');
  const theme = useTheme();
  const classes = useStyles();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));
  const { testEndpoint } = useContext(AppStateContext);
  const [urlParameters, setUrlParameters] = useState(getUrlParameters(endpoint.url));
  const [queryParams, setQueryParams] = useState(initialQueryParamsValues(endpoint.parameters));

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function parseQueryParams(params: typeof queryParams) {
    return Object.entries(params).reduce((acc, [name, value]) => `${acc}&${name}=${value}`, '');
  }

  async function handleTest() {
    const queryString = parseQueryParams(queryParams);
    const response = await testEndpoint(endpoint, urlParameters, queryString, requestBody);

    if (response.status < 300) {
      try {
        const data = await response.json();

        setResponseJson(JSON.stringify(data));
      } catch (e) {
        setResponseJson('');
      }
    }
  }

  return (
    <div>
      <Button onClick={handleClickOpen}>Test endpoint</Button>
      <Dialog
        closeAfterTransition
        aria-labelledby="max-width-dialog-title"
        fullScreen={fullScreen}
        maxWidth="md"
        open={open}
        onClose={handleClose}
      >
        <DialogTitle disableTypography id="max-width-dialog-title" style={{ minWidth: 500 }}>
          <Typography
            style={{ marginRight: 40 }}
            variant="h6"
          >{`Test endpoint ${endpoint.method}:${endpoint.url}`}</Typography>
          <IconButton aria-label="close" className={classes.closeButton} onClick={handleClose}>
            <Close />
          </IconButton>
        </DialogTitle>
        {Object.keys(urlParameters).length > 0 && (
          <DialogContent>
            <UrlParameters
              endpoint={endpoint}
              urlParameters={urlParameters}
              setUrlParameters={setUrlParameters}
            />
          </DialogContent>
        )}
        {endpoint.parameters.length > 0 && (
          <DialogContent>
            <QueryParameters
              endpoint={endpoint}
              queryParams={queryParams}
              setQueryParams={setQueryParams}
            />
          </DialogContent>
        )}
        <DialogContent>
          {showRequestBody ? (
            <CodeEditor
              code={requestBody}
              language="json"
              title="Request body"
              onSave={setRequestBody}
            />
          ) : (
            <Button onClick={() => setShowRequestBody(true)}>Add request body</Button>
          )}
        </DialogContent>
        <DialogContent>
          {responseJson && (
            <>
              <Typography variant="body1">Response</Typography>
              <SyntaxHighlighter language="json">
                {JSON.stringify(JSON.parse(responseJson), null, 2)}
              </SyntaxHighlighter>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <CopyCurl
            endpoint={endpoint}
            queryString={parseQueryParams(queryParams)}
            requestBody={requestBody}
          />
          <Button onClick={handleTest}>Test</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
