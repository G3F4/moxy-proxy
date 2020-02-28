import { Selector } from 'testcafe';
import userClick from '../utils/userClick';

export default function appBar() {
  const appBarContainer = Selector('header');

  return {
    stateScenario() {
      const stateScenarioContainer = appBarContainer.find('label').withText('State scenario').parent();

      return {
        async selectOption(scenarioName: string) {
          const optionSelector = stateScenarioContainer.find('li').withText(scenarioName);

          await userClick(stateScenarioContainer);
          await userClick(optionSelector);
        },
      }
    }
  }
}
