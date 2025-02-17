import { Page } from 'puppeteer';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { selectors } from '../constants/selectors';
import { text } from '../constants/text';
import { getHumanizedWaitTime } from '../utils/timer';

const { messageSelectors } = selectors;

export default async function mainDoc(page: Page, cluster: string): Promise<void> {
  const textToSend = cluster === 'SendPdf' ? text.sendPhotos : text.sendPhotosLocation;
  try {
    const pdfPath = join(process.cwd(), 'doc', 'clusters', cluster);
    const pdf = await readdir(pdfPath);
    await getHumanizedWaitTime(1500);
    page.click(messageSelectors.documentSelector);
    await getHumanizedWaitTime(1500);


    for (let i = 0; i < pdf.length; i++) {
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        i === 0
        ? await page.click(messageSelectors.documentSelector)
        : await page.click(messageSelectors.anotherUpload)
      ])

      fileChooser.accept([join(pdfPath, pdf[i])]);
      console.log('Photo:', pdf[i], 'uploaded');
      
      await getHumanizedWaitTime(1500);
    }

    await page.type(messageSelectors.textInputSelector, textToSend);
    await getHumanizedWaitTime(2500);
    await page.keyboard.press('Enter');
    await getHumanizedWaitTime(48000);
  } catch (error) {
    console.error('Error sending pdf:', error);
  }
}