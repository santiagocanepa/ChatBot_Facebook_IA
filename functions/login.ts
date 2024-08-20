import puppeteer, { Browser, Page } from 'puppeteer';
import { existsSync } from 'fs';
import dotenv from 'dotenv';
import { load, save } from './utils/save';
import wait from './utils/timer';
import { options, directions, paths, selectors } from './constants/selectors';
import { userAgent, viewPort } from './constants/settings';

dotenv.config();

const { main } = directions;
const { loginSelectors } = selectors;
const { cookiesPath } = paths;

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
  return existsSync(cookiesPath);
}

async function login(): Promise<{ browser: Browser, page: Page }> {
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();

  await page.setUserAgent(userAgent);
  await page.setViewport(viewPort);

  await loadCookies(page);

  const isLog = await isLoggedIn(page);

  if (!isLog) {
    await page.type(loginSelectors.userSelector, username);
    await page.type(loginSelectors.passwordSelector, password);
    await page.keyboard.press('Enter');
    await wait(3000);
    await save(cookiesPath, JSON.stringify(await page.cookies()));
  }

  return { browser, page };
}

export default login;
