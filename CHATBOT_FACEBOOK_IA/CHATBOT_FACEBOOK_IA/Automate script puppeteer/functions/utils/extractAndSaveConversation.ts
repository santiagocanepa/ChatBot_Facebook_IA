import { Page } from 'puppeteer';
import { writeFile } from 'node:fs/promises';
import { selectors } from '../constants/selectors';
import {responseregex} from './regex';
const { messageSelectors } = selectors;

async function extractAndSaveConversation(page: Page, filePath: string): Promise<string> {
  try {
   
    const messageSelector = messageSelectors.messageContainer;

    await page.waitForSelector(messageSelector, { timeout: 30000 });
    const messageElements = await page.$$(messageSelector);

    const messages: string[] = [];

    for (const element of messageElements) {
      let text = await element.evaluate((el) => el.textContent || '');
      text = responseregex(text); 
      messages.push(text);
    }

    const conversationText = messages.join('\n');

    await writeFile(filePath, JSON.stringify({ messages }, null, 2), 'utf-8');

    return conversationText; 
  } catch (err) {
    console.error('There was an error extracting the conversation: ', err);
    throw new Error(err as string);
  }
}

export default extractAndSaveConversation;

