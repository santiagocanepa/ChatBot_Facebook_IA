import { ElementHandle, Page } from "puppeteer";
import { selectors } from "../constants/selectors";

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

export { getChats, isNewMessage };
