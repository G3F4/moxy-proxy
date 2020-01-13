import {ButtonGroup, TextField} from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Step from '@material-ui/core/Step';
import StepContent from '@material-ui/core/StepContent';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';
import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Editor from '@monaco-editor/react';
import React, {useRef, useState} from 'react';
import {Method, Route} from '../../../sharedTypes';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    button: {
      marginTop: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    actionsContainer: {
      marginBottom: theme.spacing(2),
    },
    resetContainer: {
      padding: theme.spacing(3),
    },
  }),
);

function getSteps() {
  return ['URL pattern', 'Select request type', 'Define response', 'Update server state'];
}

function UrlPatternStep({ url, onUrlChange }: { url: string, onUrlChange: any }) {
  return (
    <TextField
      label="URL pattern"
      value={url}
      onChange={event => onUrlChange(event.target.value)}
    />
  )
}

function RequestMethodStep({ method, onMethodChange }: { method: Method, onMethodChange: (value: Method) => void }) {
  return (
    <ButtonGroup variant="text" color="primary" aria-label="text primary button group">
      <Button
        onClick={() => onMethodChange('get')}
        variant={method === 'get' ? 'outlined' : undefined}
      >Get</Button>
      <Button
        onClick={() => onMethodChange('post')}
        variant={method === 'post' ? 'outlined' : undefined}
      >Post</Button>
      <Button
        onClick={() => onMethodChange('put')} variant={method === 'put' ? 'outlined' : undefined}>Put</Button>
      <Button
        onClick={() => onMethodChange('patch')}
        variant={method === 'patch' ? 'outlined' : undefined}
      >Patch</Button>
      <Button
        onClick={() => onMethodChange('delete')}
        variant={method === 'delete' ? 'outlined' : undefined}
      >Delete</Button>
    </ButtonGroup>
  )
}

const initialResponseCode = `
function responseReturn(serverState, request) {
    return {
        serverEmpty: serverState.empty
    };
}

return responseReturn(serverState, request);
`;

function ResponseStep({ code, onChange }: { code: string, onChange: (code: string) => void }) {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const valueGetter = useRef();
  
  function handleEditorDidMount(_valueGetter: any) {
    setIsEditorReady(true);
    valueGetter.current = _valueGetter;
  }
  
  function handleSave() {
    // @ts-ignore
    onChange(valueGetter.current());
    // @ts-ignore
    console.log(['code'], valueGetter.current());
  }

  return (
    <>
      <button onClick={handleSave} disabled={!isEditorReady}>
        Save
      </button>
      <Editor
        height="50vh"
        width="80vw"
        language="typescript"
        value={code}
        editorDidMount={handleEditorDidMount}
      />
    </>
  );
}

const initialServerStateUpdateCode = `
function stateUpdate(serverState, request) {
    console.log('request.body', request.body);
    return {
        ...serverState,
        ...request.body,
    };
}

return stateUpdate(serverState, request);
`;

function UpdateServerStateStep({ code, onChange }: { code: string, onChange: (code: string) => void }) {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const valueGetter = useRef();
  
  function handleEditorDidMount(_valueGetter: any) {
    setIsEditorReady(true);
    valueGetter.current = _valueGetter;
  }
  
  function handleSave() {
    // @ts-ignore
    onChange(valueGetter.current());
    // @ts-ignore
    console.log(['code'], valueGetter.current());
  }
  
  return (
    <>
      <button onClick={handleSave} disabled={!isEditorReady}>
        Save
      </button>
      <Editor
        height="50vh"
        width="80vw"
        language="javascript"
        value={code}
        editorDidMount={handleEditorDidMount}
      />
    </>
  );
}

export default function AddRouteStepper({ onDone }: { onDone: any }) {
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [route, setRoute] = useState<Route>({
    url: '/',
    method: '',
    responseCode: initialResponseCode,
    serverStateUpdateCode: initialServerStateUpdateCode,
  });
  
  function getStepContent(step: number) {
    switch (step) {
      case 0: {
        return (
          <UrlPatternStep
            url={route.url}
            onUrlChange={(url: string) => setRoute(route => ({
              ...route,
              url,
            }))}
          />
        );
      }
      case 1: {
        return (
          <RequestMethodStep
            method={route.method}
            onMethodChange={method => setRoute(route => ({
              ...route,
              method,
            }))}
          />
        );
      }
      case 2: {
        return (
          <ResponseStep
            code={route.responseCode}
            onChange={responseCode => setRoute(route => ({
              ...route,
              responseCode,
            }))}
          />
        );
      }
      case 3: {
        return (
          <UpdateServerStateStep
            code={route.serverStateUpdateCode}
            onChange={serverStateUpdateCode => setRoute(route => ({
              ...route,
              serverStateUpdateCode,
            }))}
          />
        );
      }
      default:
        return 'Unknown step';
    }
  }
  
  const steps = getSteps();
  
  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };
  
  const handleSubmit = () => {
    onDone(route);
  };
  
  return (
    <div className={classes.root}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              <Typography>{getStepContent(index)}</Typography>
              <div className={classes.actionsContainer}>
                <div>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    className={classes.button}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    className={classes.button}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length && (
        <Paper square elevation={0} className={classes.resetContainer}>
          <Typography>Route ready to submit</Typography>
          <Button onClick={handleBack} className={classes.button}>
            Back
          </Button>
          <Button color="primary" onClick={handleSubmit} className={classes.button}>
            Submit
          </Button>
        </Paper>
      )}
    </div>
  );
}