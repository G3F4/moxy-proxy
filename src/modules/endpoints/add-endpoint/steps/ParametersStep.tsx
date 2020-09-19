import { TextField } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import React from 'react';
import { EndpointParameter } from '../../../../../sharedTypes';

export const parametersTypes = [
  { text: 'String', value: 'string' },
  { text: 'Number', value: 'number' },
  { text: 'Boolean', value: 'boolean' },
  { text: 'String array', value: 'stringArray' },
  { text: 'Number array', value: 'numberArray' },
  { text: 'Object', value: 'object' },
] as const;

export default function ParametersStep({
  parameters,
  onParametersChange,
  addParameter,
}: {
  parameters: EndpointParameter[];

  onParametersChange(parameter: EndpointParameter): void;
  addParameter(parameter: EndpointParameter): void;
}) {
  function handleAddParameter() {
    addParameter({
      id: (parameters.length + 1).toString(),
      name: '',
      type: '',
    });
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
              onChange={event =>
                onParametersChange({ name: event.target.value, type, id })
              }
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
                onParametersChange({
                  id,
                  type: event.target.value as string,
                  name,
                })
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
