import { ElementHandle, Page } from "puppeteer";
import { selectors } from "../constants/selectors";
import dotenv from 'dotenv';
dotenv.config();
const { moveSelectors } = selectors;

const isNewMessage = async (page: Page, chat: ElementHandle<Element>): Promise<boolean | null> => {
  const evaluateChat = await page.evaluate((chat, sel) => {
    const messageToEvalute = chat.querySelector(sel);
    return messageToEvalute ? true : null;
  }, chat, moveSelectors.blueSelector);

  return evaluateChat;
}

const getChats = async (page: Page): Promise<{ chat: ElementHandle<Element>, menuButton: ElementHandle<Element> | null }[] | undefined> => {
  const windowChat = await page.$(moveSelectors.windowsSelector);
  const chats = await windowChat?.$$(moveSelectors.chatsSelector);

  if (chats) {
    const chatDetails = await Promise.all(chats.map(async chat => {
      const menuButton = await chat.$(moveSelectors.menuButtonSelector);
      return { chat, menuButton };
    }));

    return chatDetails;
  }

  return undefined;
}

const scrollChatWindow = async (page: Page) => {
  const isMarketplace = process.env.MARKETPLACE === 'true'; 
  const label = isMarketplace ? 'Marketplace' : 'Chats';  
  await page.evaluate((label: string) => {
    const mainContainer = document.querySelector(`div[aria-label="${label}"][role="grid"]`);
    let foundScrollableElement = null;

    if (mainContainer) {
        const allChildren = mainContainer.querySelectorAll('div');
        for (const child of allChildren) {
            if (child.scrollHeight > child.clientHeight) {
                foundScrollableElement = child;
                break;
            }
        }
    }

    if (foundScrollableElement) {
        foundScrollableElement.scrollBy({
            top: 100000, 
            behavior: 'smooth' 
        });
    }
  }, label);
};

export { getChats, isNewMessage, scrollChatWindow };
