import { IconButton, TextField, useMediaQuery } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Snackbar from '@material-ui/core/Snackbar';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Close } from '@material-ui/icons';
import CloseIcon from '@material-ui/icons/Close';
import React, { SyntheticEvent, useContext, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Endpoint, EndpointParameter } from '../../../sharedTypes';
import { AppStateContext } from '../../App';
import CodeEditor from '../../common/CodeEditor';

function CopyCurl({
  endpoint,
  queryString,
  requestBody,
}: {
  endpoint: Endpoint;
  queryString: string;
  requestBody: string;
}) {
  const [open, setOpen] = useState(false);
  const handleClick = async () => {
    setOpen(true);
    await navigator.clipboard.writeText(
      `curl -i --header "Content-Type: application/json" --request ${endpoint.method.toLocaleUpperCase()} --data '${JSON.stringify(
        JSON.parse(requestBody),
      )}' ${window.location.origin}/${endpoint.url}?${queryString}`,
    );
  };
  const handleClose = (event: SyntheticEvent | MouseEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  return (
    <div>
      <Button onClick={handleClick}>Copy CURL to clipboard</Button>
      <Snackbar
        action={
          <IconButton aria-label="close" color="inherit" size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        autoHideDuration={6000}
        message="CURL copied to clipboard!"
        open={open}
        onClose={handleClose}
      />
    </div>
  );
}

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
  const urlParts = endpoint.url.split('/').filter(Boolean);

  console.log(['endpoint'], endpoint);

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
            <Typography style={{ flexGrow: 1 }} variant="subtitle2">
              Fill url parameters
            </Typography>
            <div style={{ display: 'flex' }}>
              {urlParts.map(part => {
                const urlParameter = part[0] === urlDelimiter;

                if (urlParameter) {
                  const parameterName = part.slice(1);
                  const value = urlParameters[parameterName];

                  return (
                    <TextField
                      required
                      label={parameterName}
                      placeholder="Set parameter value"
                      value={value}
                      onChange={event => {
                        setUrlParameters({
                          ...urlParameters,
                          [parameterName]: event.target.value,
                        });
                      }}
                    />
                  );
                } else {
                  return (
                    <Typography
                      style={{ marginTop: 20, marginRight: 5 }}
                      variant="body1"
                    >{`${part} /`}</Typography>
                  );
                }
              })}
            </div>
          </DialogContent>
        )}
        {endpoint.parameters.length > 0 && (
          <DialogContent>
            <Typography variant="subtitle2">Fill query parameters</Typography>
            <div style={{ display: 'flex' }}>
              {endpoint.parameters.map(({ id, name, type }, index) => (
                <>
                  <Typography style={{ marginTop: 20, marginRight: 5 }} variant="body1">{`${
                    index > 0 ? '& ' : ''
                  }${name} = `}</Typography>
                  <TextField
                    label={name}
                    placeholder="Set query parameter value"
                    value={queryParams[name]}
                    onChange={event => {
                      setQueryParams({
                        ...queryParams,
                        [name]: event.target.value,
                      });
                    }}
                  />
                </>
              ))}
            </div>
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
