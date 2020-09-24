import {
  InputData,
  jsonInputForTargetLanguage,
  quicktype,
} from 'quicktype-core';

export default async function generateTypeFromJSON(
  targetLanguage: string,
  typeName: string,
  jsonString: string,
) {
  const jsonInput = jsonInputForTargetLanguage(targetLanguage);

  await jsonInput.addSource({
    name: typeName,
    samples: [jsonString],
  });

  const inputData = new InputData();

  inputData.addInput(jsonInput);

  const { lines } = await quicktype({
    inputData,
    lang: targetLanguage,
  });

  return lines.slice(9, lines.length - 155).join('\n');
}
