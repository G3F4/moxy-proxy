import { ButtonGroup, TextField } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import Step from '@material-ui/core/Step';
import StepContent from '@material-ui/core/StepContent';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import produce from 'immer';
import React, { useState } from 'react';
import { Endpoint, EndpointParameter, Method } from '../../../sharedTypes';
import CodeEditor from '../../common/CodeEditor';

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
  return [
    'URL pattern',
    'Select request type',
    'Add parameters',
    'Define response',
    'Update server state',
  ];
}

function UrlPatternStep({ url, onUrlChange }: { url: string; onUrlChange: any }) {
  return (
    <TextField
      label="URL pattern"
      name="url"
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

export const parametersTypes = [
  { text: 'String', value: 'string' },
  { text: 'Number', value: 'number' },
  { text: 'Boolean', value: 'boolean' },
  { text: 'String array', value: 'stringArray' },
  { text: 'Number array', value: 'numberArray' },
  { text: 'Object', value: 'object' },
] as const;

function ParametersStep({
  parameters,
  onParametersChange,
  addParameter,
}: {
  parameters: EndpointParameter[];

  onParametersChange(parameter: EndpointParameter): void;
  addParameter(parameter: EndpointParameter): void;
}) {
  function handleAddParameter() {
    addParameter({ id: (parameters.length + 1).toString(), name: '', type: '' });
  }

  return (
    <>
      {parameters.map(({ id, name, type }) => (
        <div key={id}>
          <FormControl
            style={{
              margin: 8,
              minWidth: 120,
            }}
          >
            <TextField
              label="Parameter name"
              value={name}
              onChange={event => onParametersChange({ name: event.target.value, type, id })}
            />
          </FormControl>
          <FormControl
            style={{
              margin: 8,
              minWidth: 160,
            }}
          >
            <InputLabel id="parameter-typ-label">Parameter type</InputLabel>
            <Select
              id="parameter-type-select"
              labelId="parameter-typ-label"
              value={type}
              onChange={event =>
                onParametersChange({ id, type: event.target.value as string, name })
              }
            >
              {parametersTypes.map(({ text, value }) => (
                <MenuItem key={value} value={value}>
                  {text}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      ))}
      <div>
        <Button onClick={handleAddParameter}>Add parameter</Button>
      </div>
    </>
  );
}

const initialResponseCode = `
function requestResponse(state, request) {
    return state;
}
`;

function ResponseStep({ code, onChange }: { code: string; onChange: (code: string) => void }) {
  return <CodeEditor code={code} onSave={onChange} />;
}

const initialServerStateUpdateCode = `
function serverUpdate(request) {
    return function (state) {
      state.modified = true;
    };
}
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
