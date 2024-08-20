import { Page } from 'puppeteer';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { selectors } from '../constants/selectors';
import { text } from '../constants/text';
import wait from '../utils/timer';

const { messageSelectors } = selectors;

export default async function mainImages(page: Page, cluster: string): Promise<void> {
  const textToSend = cluster === 'Envio_Fotos' ? text.sendPhotos : text.sendPhotosLocation;
  try {
    const imagePath = join(process.cwd(), 'images', 'clusters', cluster);
    const images = await readdir(imagePath);
    await wait(1500);
    page.click(messageSelectors.imagesSelector);
    await wait(1500);


    for (let i = 0; i < images.length; i++) {
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        i === 0
        ? await page.click(messageSelectors.imagesSelector)
        : await page.click(messageSelectors.anotherUpload)
      ])

      fileChooser.accept([join(imagePath, images[i])]);
      console.log('Photo:', images[i], 'uploaded');
      
      await wait(1500);
    }

    await page.type(messageSelectors.textInputSelector, textToSend);
    await wait(2500);
    await page.keyboard.press('Enter');
    await wait(48000);
  } catch (error) {
    console.error('Error sending images:', error);
  }
}