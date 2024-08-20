import { Page } from "puppeteer";
import { selectors } from "../constants/selectors";
import { text } from "../constants/text";
import wait from "../utils/timer";

const { messageSelectors } = selectors;

export default async function repr(page: Page) {
  const textbox = messageSelectors.textInputSelector;
  await wait(3000)
  if (textbox) {
    await page.type(textbox, text.REPR);
    await wait(7500)
    await page.keyboard.press('Enter');
  }

  await wait(3000);
}