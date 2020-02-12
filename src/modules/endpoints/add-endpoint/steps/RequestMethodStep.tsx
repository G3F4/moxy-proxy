import { ButtonGroup } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import React from 'react';
import { Method } from '../../../../../sharedTypes';

export default function RequestMethodStep({
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
