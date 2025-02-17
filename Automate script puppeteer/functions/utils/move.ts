import { Page } from 'puppeteer';
import { selectors } from '../constants/selectors';
import wait from './timer';
import dotenv from 'dotenv';
dotenv.config();
const { moveSelectors } = selectors;
import { getHumanizedWaitTime } from './timer';


async function move(page: Page) {
  const isMarketplace = process.env.MARKETPLACE === 'true'; 

  try {
    while (true) {
      try {
        try {
          await getHumanizedWaitTime();
          await page.waitForSelector(moveSelectors.messangerSelector, { timeout: 15000 });
          await page.click(moveSelectors.messangerSelector);
        } catch (error) {}

        try {
          await getHumanizedWaitTime();
          await page.waitForSelector(moveSelectors.messagerExpandSelector, { timeout: 15000 });
          await page.click(moveSelectors.messagerExpandSelector);

          await getHumanizedWaitTime(2200, 4400); 
        } catch (error) {}

        try {
          await page.waitForSelector(moveSelectors.CloseSync, { timeout: 15000 });
          await page.click(moveSelectors.CloseSync);
          await getHumanizedWaitTime();
        } catch (error) {}

        try {
          await page.waitForSelector(moveSelectors.dontSync, { timeout: 15000 });
          await page.click(moveSelectors.dontSync);
        } catch (error) {}

        await getHumanizedWaitTime();

        if (isMarketplace) {
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
            await new Promise(resolve => setTimeout(resolve, 2000)); 
            break; 
          } else {
            console.error('MarketPlace button not found');
          }
        }
      } catch (err) {
        console.error('There was an error with a selector: ', err);
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 4000)); 
      }
    }
  } catch (err) {
    console.error('There was an error moving to messenger: ', err);
    throw new Error(err as string);
  }
}

export default move;
