import React from 'react';
import CodeEditor from '../../../../common/CodeEditor';

export const initialServerStateUpdateCode = `
function serverUpdate(request) {
  return function stateUpdate(state) {
    state.modified = true;
  };
};
`;

export default function UpdateServerStateStep({
  code,
  onChange,
}: {
  code: string;
  onChange: (code: string) => void;
}) {
  return <CodeEditor code={code} onSave={onChange} />;
}
