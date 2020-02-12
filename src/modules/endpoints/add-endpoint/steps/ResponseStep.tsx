import React from 'react';
import CodeEditor from '../../../../common/CodeEditor';

export const initialResponseCode = `
function requestResponse(state, request) {
  return state;
};
`;

export default function ResponseStep({
  code,
  onChange,
}: {
  code: string;
  onChange: (code: string) => void;
}) {
  return <CodeEditor code={code} onSave={onChange} />;
}
