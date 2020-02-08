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
import { Endpoint } from '../../../sharedTypes';
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
      `curl -i --header "Content-Type: application/json" --request ${endpoint.method.toLocaleUpperCase()} --data '${JSON.stringify(JSON.parse(requestBody))}' ${window.location.origin}/${endpoint.url}?${queryString}`,
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
      }
    }

    return acc;
  }, {} as Record<string, string>)
}

export default function TestEndpoint({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);
  const [requestBody, setRequestBody] = useState(emptyJsonString);
  const [showRequestBody, setShowRequestBody] = useState(false);
  const [responseJson, setResponseJson] = useState('');
  const [queryString, setQueryString] = useState('');
  const [showQueryString, setShowQueryString] = useState(false);
  const theme = useTheme();
  const classes = useStyles();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));
  const { testEndpoint } = useContext(AppStateContext);
  const [urlParameters, setUrlParameters] = useState(getUrlParameters(endpoint.url));
  const urlParts = endpoint.url.split('/').filter(Boolean);

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleTest() {
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
          <DialogContent style={{ display: 'flex' }}>
            {urlParts.map(part => {
              const urlParameter = part[0] === urlDelimiter;

              if (urlParameter) {
                const parameterName = part.slice(1);
                const value = urlParameters[parameterName];

                return (
                  <TextField
                    label={parameterName}
                    placeholder="Set parameter value"
                    value={value}
                    onChange={event => {
                      setUrlParameters({
                        ...urlParameters,
                        [parameterName]: event.target.value,
                      });
                    }}
                    required
                  />
                );
              } else {
                return (
                  <Typography variant="body1" style={{ marginTop: 20, marginRight: 5  }}>{`${part} /`}</Typography>
                );
              }
            })}
          </DialogContent>
        )}
        <DialogContent>
          {showQueryString ? (
            <TextField
              fullWidth
              label="Query string"
              value={queryString}
              onChange={event => setQueryString(event.target.value)}
            />
          ) : (
            <Button onClick={() => setShowQueryString(true)}>Add query string</Button>
          )}
        </DialogContent>
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
              <SyntaxHighlighter language="json">{responseJson.trim()}</SyntaxHighlighter>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <CopyCurl endpoint={endpoint} queryString={queryString} requestBody={requestBody} />
          <Button onClick={handleTest}>Test</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
