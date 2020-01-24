import puppeteer from 'puppeteer';
import React from 'react';

test('renders ok', async () => {
  const url = 'http://localhost:5000/';
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  //  await page.setRequestInterception(true);
  //  page.on('request', interceptedRequest => {
  //    interceptedRequest.continue();
  //  });

  async function clickButtonWithText(text: string) {
    const buttons = await page.$x(`//button[contains(., '${text}')]`);

    buttons[0].click();
  }

  async function waitForElementWithText(text: string) {
    await page.waitForFunction(
      //@ts-ignore
      nodeText => document.querySelector('body').innerText.includes(nodeText),
      {},
      text,
    );
  }

  async function fillInputWithName(inputName: string, text: string) {
    await page.type(`input[name=${inputName}]`, text, { delay: 20 });
  }

  await page.emulate({ viewport: { width: 1080, height: 940 }, userAgent: '' });
  await page.goto(url);

  await page.waitFor(100);

  await waitForElementWithText('Moxy Proxy');

  await clickButtonWithText('Add endpoint');

  await waitForElementWithText('URL pattern');

  await fillInputWithName('url', 'user/add');

  //  await clickButtonWithText('Next');
  //
  //  await page.waitFor(100);
  //
  //  await clickButtonWithText('Next');
  //
  //  await page.waitFor(100);
  //
  //  await clickButtonWithText('Next');
  //
  //  await page.waitFor(100);
  //
  //  await clickButtonWithText('Next');
  //
  //  await page.waitFor(100);
  //
  //  await clickButtonWithText('Submit');

  await page.screenshot({ path: `${process.cwd()}/page.png`, fullPage: true, type: 'png' });
  await browser.close();
});
