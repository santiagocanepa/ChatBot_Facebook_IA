import { join } from 'node:path';

const options = {
  headless: true,
  args: ['--start-maximized', '--disable-infobars'],
  defaultViewport: null,
  executablePath: '/usr/bin/google-chrome-stable'
};

const directions = {
  main: 'https://www.facebook.com',
  google: 'https://www.google.com'
};

const paths = {
  cookiesPath: join(process.cwd(), 'cookies/cookies.json'),
};

const selectors = {
  loginSelectors: {
    userSelector: '#email',
    passwordSelector: '#pass',
    isLoggedInSelector: 'div[aria-label="stories tray"]',
  },
  moveSelectors: {
    messangerSelector: 'div[aria-label*="Messenger"]',
    messagerExpandSelector: 'a[aria-label="See all in Messenger"]',
    marketPlaceSelector: '//div[@role="button"]//span[text()="Marketplace"]',
    windowsSelector: 'div[aria-label="Marketplace"]',
    chatsSelector: 'div.x78zum5.xdt5ytf[data-virtualized="false"]',
    blueSelector: 'span[data-visualcompletion="ignore"]',
    CloseSync: 'div[aria-label="Close"][role="button"]',
    dontSync: 'div[aria-label="Don\'t sync"][role="button"][tabindex="0"]',
    menuButtonSelector: 'div[aria-label="Menu"][role="button"]',  // Nuevo
    archiveButtonSelector: 'div[role="menuitem"]:has(span:contains("Archive chat"))'  // Nuevo
  },
  messageSelectors: {
    messageContainer: 'div[dir="auto"].html-div',
    imagesSelector: 'div[aria-label="Attach a file"]',
    textInputSelector: 'div[aria-label="Message"]',
    fileInputSelector: 'input[type="file"]',
    anotherUpload: 'div[aria-label="Upload another file"]',
    TitleSelector: 'div[aria-label^="Conversation titled"]'
  },
};
export { options, directions, paths, selectors };
