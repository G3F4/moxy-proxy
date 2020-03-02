import { Selector, t } from 'testcafe';
import userClick from '../utils/userClick';

export default function appBar() {
  const appBarContainer = Selector('header');

  function getViewModeSelect() {
    return appBarContainer
      .find('label')
      .withText('View mode')
      .parent();
  }

  function getStateScenarioSelect() {
    return appBarContainer
      .find('label')
      .withText('State scenario')
      .parent();
  }

  async function selectOption(select: Selector, optionLabel: string) {
    await userClick(select);

    const option = select
      .find('li')
      .withText(optionLabel);

    await userClick(option);
  }

  return {
    async changeStateScenario(scenarioName: string) {
      const select = getStateScenarioSelect();

      await selectOption(select, scenarioName);
    },
    async changeViewMode(viewMode: string) {
      const select = getViewModeSelect();

      await selectOption(select, viewMode);
    },
  };
}
