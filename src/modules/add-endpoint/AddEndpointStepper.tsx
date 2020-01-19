import { ButtonGroup, TextField } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Step from '@material-ui/core/Step';
import StepContent from '@material-ui/core/StepContent';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React, { useState } from 'react';
import { Method, Endpoint } from '../../../sharedTypes';
import CodeEditor from '../common/CodeEditor';

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

function UrlPatternStep({ url, onUrlChange }: { url: string; onUrlChange: any }) {
  return (
    <TextField
      label="URL pattern"
      value={url}
      onChange={event => onUrlChange(event.target.value)}
    />
  );
}

function RequestMethodStep({
  method,
  onMethodChange,
}: {
  method: Method;
  onMethodChange: (value: Method) => void;
}) {
  return (
    <ButtonGroup aria-label="text primary button group" color="primary" variant="text">
      <Button
        variant={method === 'get' ? 'outlined' : undefined}
        onClick={() => onMethodChange('get')}
      >
        Get
      </Button>
      <Button
        variant={method === 'post' ? 'outlined' : undefined}
        onClick={() => onMethodChange('post')}
      >
        Post
      </Button>
      <Button
        variant={method === 'put' ? 'outlined' : undefined}
        onClick={() => onMethodChange('put')}
      >
        Put
      </Button>
      <Button
        variant={method === 'patch' ? 'outlined' : undefined}
        onClick={() => onMethodChange('patch')}
      >
        Patch
      </Button>
      <Button
        variant={method === 'delete' ? 'outlined' : undefined}
        onClick={() => onMethodChange('delete')}
      >
        Delete
      </Button>
    </ButtonGroup>
  );
}

const initialResponseCode = `
((state, { body }) => { // return response, don't add code at start
  return {

  };
})(state, request); // changing those args name breaks script
`;

function ResponseStep({ code, onChange }: { code: string; onChange: (code: string) => void }) {
  return <CodeEditor code={code} onSave={onChange} />;
}

const initialServerStateUpdateCode = `
// function(request) { this line is added on server
// inside returned function draft is mutable
return state => {

};
// } this line is added on server
`;

function UpdateServerStateStep({
  code,
  onChange,
}: {
  code: string;
  onChange: (code: string) => void;
}) {
  return <CodeEditor code={code} onSave={onChange} />;
}

export default function AddEndpointStepper({ onDone }: { onDone: any }) {
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [endpoint, setEndpoint] = useState<Endpoint>({
    id: Date.now().toString(),
    url: '/',
    method: 'get',
    responseCode: initialResponseCode,
    serverStateUpdateCode: initialServerStateUpdateCode,
  });

  function getStepContent(step: number) {
    switch (step) {
      case 0: {
        return (
          <UrlPatternStep
            url={endpoint.url}
            onUrlChange={(url: string) =>
              setEndpoint(endpoint => ({
                ...endpoint,
                url,
              }))
            }
          />
        );
      }
      case 1: {
        return (
          <RequestMethodStep
            method={endpoint.method}
            onMethodChange={method =>
              setEndpoint(endpoint => ({
                ...endpoint,
                method,
              }))
            }
          />
        );
      }
      case 2: {
        return (
          <ResponseStep
            code={endpoint.responseCode}
            onChange={responseCode =>
              setEndpoint(endpoint => ({
                ...endpoint,
                responseCode,
              }))
            }
          />
        );
      }
      case 3: {
        return (
          <UpdateServerStateStep
            code={endpoint.serverStateUpdateCode}
            onChange={serverStateUpdateCode =>
              setEndpoint(endpoint => ({
                ...endpoint,
                serverStateUpdateCode,
              }))
            }
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
    onDone(endpoint);
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
                    className={classes.button}
                    disabled={activeStep === 0}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button
                    className={classes.button}
                    color="primary"
                    variant="contained"
                    onClick={handleNext}
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
        <Paper square className={classes.resetContainer} elevation={0}>
          <Typography>Endpoint ready to submit</Typography>
          <Button className={classes.button} onClick={handleBack}>
            Back
          </Button>
          <Button className={classes.button} color="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </Paper>
      )}
    </div>
  );
}
