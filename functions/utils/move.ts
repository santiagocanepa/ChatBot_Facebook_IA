import { Page } from 'puppeteer';
import { selectors } from '../constants/selectors';
import wait from './timer';

const { moveSelectors } = selectors;

function getRandomWaitTime(min = 8000, max = 35000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function move(page: Page) {
  try {
    while (true) {
      try {
        // Esperar que los selectores estén disponibles
        try {
          await new Promise(resolve => setTimeout(resolve, getRandomWaitTime()));
          await page.waitForSelector(moveSelectors.messangerSelector, { timeout: 15000 });
          await page.click(moveSelectors.messangerSelector);
        } catch (error) {}

        try {
          await new Promise(resolve => setTimeout(resolve, getRandomWaitTime()));
          await page.waitForSelector(moveSelectors.messagerExpandSelector, { timeout: 15000 });
          await page.click(moveSelectors.messagerExpandSelector);

          await new Promise(resolve => setTimeout(resolve, getRandomWaitTime(2200, 4400))); // Ajusta aquí los tiempos
        } catch (error) {}

        try {
          await page.waitForSelector(moveSelectors.CloseSync, { timeout: 15000 });
          await page.click(moveSelectors.CloseSync);
          await new Promise(resolve => setTimeout(resolve, getRandomWaitTime()));
        } catch (error) {}

        try {
          await page.waitForSelector(moveSelectors.dontSync, { timeout: 15000 });
          await page.click(moveSelectors.dontSync);
        } catch (error) {}

        await new Promise(resolve => setTimeout(resolve, getRandomWaitTime()));

        // Usa una función alternativa para esperar por XPath
        await page.waitForFunction(
          (xpath) => {
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            return !!result && result instanceof HTMLElement;
          },
          { timeout: 15000 },
          moveSelectors.marketPlaceSelector
        );

        const marketPlaceButton = await page.evaluateHandle((xpath) => {
          return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement;
        }, moveSelectors.marketPlaceSelector);

        if (marketPlaceButton) {
          await marketPlaceButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for the page to load
          break; // Exit the loop if successful
        } else {
          console.error('MarketPlace button not found');
        }
      } catch (err) {
        console.error('There was an error with a selector: ', err);
        await page.reload({ waitUntil: 'networkidle0' }); // Reload the page
        await new Promise(resolve => setTimeout(resolve, 4000)); // Wait before retrying
      }
    }
  } catch (err) {
    console.error('There was an error moving to messenger: ', err);
    throw new Error(err as string);
  }
}

export default move;
