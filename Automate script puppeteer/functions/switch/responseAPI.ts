import { Page } from 'puppeteer';
import { selectors } from '../constants/selectors';
import {getHumanizedWaitTime} from '../utils/timer';

const { messageSelectors } = selectors;

export async function responseAPI(page: Page, responseText: string): Promise<void> {
   const textToSend = responseText;
  try {
    await page.type(messageSelectors.textInputSelector, textToSend);
    await getHumanizedWaitTime();
    await page.keyboard.press('Enter');
    await getHumanizedWaitTime();
  } catch (error) {
    console.error('Error sending text:', error);
  }
}