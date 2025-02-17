import { Page } from 'puppeteer';
import { getHumanizedWaitTime } from './utils/timer';
import { switcher } from './switch/switcher';
import { getChats, isNewMessage, scrollChatWindow } from './utils/utils';
import extractAndSaveConversation from './utils/extractAndSaveConversation';
import move from './utils/move';
import { directions, selectors } from './constants/selectors';
import * as fs from 'fs';


const { main: mainDirection, google } = directions;
const { moveSelectors } = selectors;



const folderName = 'conversationsJson';
if (!fs.existsSync(folderName)) {
  fs.mkdirSync(folderName);
}

const main = async (page: Page) => {
  do {
    await move(page);
    await getHumanizedWaitTime(2200, 4400);
    await scrollChatWindow(page);
    await scrollChatWindow(page);
    await scrollChatWindow(page);

    await getHumanizedWaitTime(2200, 4400);

    const chats = await getChats(page);
    if (chats && chats.length > 0) {
      for (const { chat, menuButton } of chats) {
        const newMessage = await isNewMessage(page, chat);
        if (newMessage) {
          await chat.click();
          await getHumanizedWaitTime(2200, 3400);
          
          const filePath = `${folderName}/conversacion_${Date.now()}.json`;
          await getHumanizedWaitTime(3000, 5000); 
          const conversation = await extractAndSaveConversation(page, filePath);
          
          const switcherResult = await switcher(page, conversation);

          if (switcherResult === 'Noti' && menuButton) {
            try {
              await menuButton.click();
          
              let archiveButtonFound = await page.waitForFunction(() => {
                const archiveButton = Array.from(document.querySelectorAll('div[role="menuitem"]'))
                  .find(element => (element as HTMLElement).innerText.includes('Archive chat'));
                if (archiveButton) {
                  (archiveButton as HTMLElement).click();
                  return true;
                }
                return false;
              }, { timeout: 15000 });
          
              if (archiveButtonFound) {
                console.log("Chat succesfully archived");
              } else {
                throw new Error("No archive button found after first try");
              }
          
            } catch (err) {
              console.warn("Fail first attempt to archive chat, trying again", err);
          
              try {
                await menuButton.click();
          
                let archiveButtonFoundRetry = await page.waitForFunction(() => {
                  const archiveButton = Array.from(document.querySelectorAll('div[role="menuitem"]'))
                    .find(element => (element as HTMLElement).innerText.includes('Archive chat'));
                  if (archiveButton) {
                    (archiveButton as HTMLElement).click();
                    return true;
                  }
                  return false;
                }, { timeout: 15000 });
          
                if (archiveButtonFoundRetry) {
                  console.log("Chat successfully archived on the second attempt");
                } else {
                  console.log("No archive button found after two tries");
                }
          
              } catch (retryErr) {
                console.error("Error archiving chat after two atempts ", retryErr);
              }
            }
          }
                    

          await getHumanizedWaitTime(1900, 2400);
        }
      }
    }
    
    try {
      await page.goto('https://www.google.com', { waitUntil: 'networkidle2', timeout: 60000 });

      await getHumanizedWaitTime(120000, 300000); 
    
      await page.goto(mainDirection, { waitUntil: 'networkidle2', timeout: 60000 });
      await getHumanizedWaitTime(18000, 37000); 
    } catch (err) {
      console.error('Error of navegation', err);
    }
  } while (true);
};

export default main;
