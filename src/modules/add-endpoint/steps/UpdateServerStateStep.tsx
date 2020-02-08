import React from 'react';
import CodeEditor from '../../../common/CodeEditor';

export const initialServerStateUpdateCode = `
const serverUpdate = ({ body, parameters }) => (state) => {
  state.modified = true;
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
