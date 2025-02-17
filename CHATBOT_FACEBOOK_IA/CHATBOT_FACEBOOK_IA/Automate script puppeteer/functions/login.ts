import puppeteer, { Browser, Page } from 'puppeteer';
import { existsSync } from 'fs';
import dotenv from 'dotenv';
import { load, save } from './utils/save';
import { getHumanizedWaitTime } from './utils/timer';
import { options, directions, paths, selectors } from './constants/selectors';
import { userAgent, viewPort } from './constants/settings';

dotenv.config();

const { main } = directions;
const { loginSelectors } = selectors;
const { cookiesPath } = paths;
const isLoggedInSelector = loginSelectors.isLoggedInSelector;
const username = process.env.USERNAME ?? '';
const password = process.env.PASSWORD ?? '';

async function loadCookies(page: Page) {
  if (existsSync(cookiesPath)) {
    const cookiesString = await load(cookiesPath);
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
  }
  await page.goto(main);
}

async function isLoggedIn(page: Page): Promise<boolean> {

  try {
    const element = await page.$(isLoggedInSelector);
    
    return element !== null;
  } catch (error) {
    console.error('Error verification loggin', error);
    return false;
  }
}

async function login(): Promise<{ browser: Browser, page: Page }> {
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();

  await page.setUserAgent(userAgent);
  await page.setViewport(viewPort);

  await loadCookies(page);

  const isLog = await isLoggedIn(page);

  if (!isLog) {
  console.log('User no loggin, procced to loggin.');

  await page.type(loginSelectors.userSelector, username);
  await getHumanizedWaitTime(45000, 6500);

  await page.type(loginSelectors.passwordSelector, password);
  await page.keyboard.press('Enter');

  await getHumanizedWaitTime(4000, 6000);

  let isLogAfterLogin = await isLoggedIn(page);

  if (isLogAfterLogin) {
    console.log('Init session success.');
    await save(cookiesPath, JSON.stringify(await page.cookies()));
  } else {
    console.log('Could not log in on the first attempt.');

    const screenshotPath = '/home/admin/screenshot_login_failed.png'; 
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot save in ${screenshotPath}`);

    console.log('Retry with only password.');

    await page.click(loginSelectors.passwordSelector); 
    await page.keyboard.press('Backspace'); 
    await page.type(loginSelectors.passwordSelector, password);
    await page.keyboard.press('Enter');

    await getHumanizedWaitTime(25000, 5000);

    isLogAfterLogin = await isLoggedIn(page);

    if (isLogAfterLogin) {
      console.log('Second attempt successful.');
      await save(cookiesPath, JSON.stringify(await page.cookies()));
    } else {
      console.log('Could not log in on the second attempt');
      const screenshotPathRetry = '/home/admin/screenshot_login_failed_retry.png';
      await page.screenshot({ path: screenshotPathRetry });
      console.log(`Screenshot save in: ${screenshotPathRetry}`);
    }
  }
} else {
  console.log('User is already logged in.');
}

return { browser, page };

}

export default login;
