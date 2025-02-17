import { Page } from "puppeteer";
import { selectors } from "../constants/selectors";
import { text } from "../constants/text";
import {getHumanizedWaitTime} from "../utils/timer";

const { messageSelectors } = selectors;

export default async function responseinit1(page: Page) {
  const textbox = messageSelectors.textInputSelector;
  await getHumanizedWaitTime(3000)
  if (textbox) {
    await page.type(textbox, text.responseinit1);
    await getHumanizedWaitTime(7500)
    await page.keyboard.press('Enter');
  }

  await getHumanizedWaitTime(3000);
}