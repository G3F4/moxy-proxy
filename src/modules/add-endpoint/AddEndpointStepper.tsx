import { DialogActions } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import DialogContent from '@material-ui/core/DialogContent';
import Paper from '@material-ui/core/Paper';
import Step from '@material-ui/core/Step';
import StepContent from '@material-ui/core/StepContent';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import produce from 'immer';
import React, { useState } from 'react';
import { Endpoint, EndpointParameter } from '../../../sharedTypes';
import ParametersStep from './steps/ParametersStep';
import RequestMethodStep from './steps/RequestMethodStep';
import ResponseStep, { initialResponseCode } from './steps/ResponseStep';
import UpdateServerStateStep, { initialServerStateUpdateCode } from './steps/UpdateServerStateStep';
import UrlPatternStep from './steps/UrlPatternStep';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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
  return [
    'URL pattern',
    'Select request type',
    'Add parameters',
    'Define response',
    'Update server state',
  ];
}

export default function AddEndpointStepper({ onDone }: { onDone: any }) {
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [endpoint, setEndpoint] = useState<Endpoint>({
    id: Date.now().toString(),
    url: '',
    method: 'get',
    parameters: [],
    responseStatus: null,
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
          <ParametersStep
            addParameter={parameter => {
              setEndpoint(endpoint => ({
                ...endpoint,
                parameters: [...endpoint.parameters, parameter],
              }));
            }}
            parameters={endpoint.parameters}
            onParametersChange={parameter => {
              function updateParameters(
                parameters: EndpointParameter[],
                parameter: EndpointParameter,
              ) {
                return produce(parameters, draft => {
                  const parameterIndex = parameters.findIndex(({ id }) => id === parameter.id);

                  if (!(parameterIndex < 0)) {
                    draft[parameterIndex] = parameter;
                  }
                });
              }

              const parameters = updateParameters(endpoint.parameters, parameter);

              setEndpoint(endpoint => ({
                ...endpoint,
                parameters,
              }));
            }}
          />
        );
      }
      case 3: {
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
      case 4: {
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
    <>
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
        <>
          <DialogContent>
            <Typography>Endpoint ready to submit</Typography>
          </DialogContent>
          <DialogActions>
            <Paper square className={classes.resetContainer} elevation={0}>
              <Button className={classes.button} onClick={handleBack}>
                Back
              </Button>
              <Button className={classes.button} color="primary" onClick={handleSubmit}>
                Submit
              </Button>
            </Paper>
          </DialogActions>
        </>
      )}
    </>
  );
}
