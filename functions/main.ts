import { Page } from 'puppeteer';
import wait from './utils/timer';
import { switcher } from './switch/switcher';
import { getChats, isNewMessage } from './utils/utils';
import extractAndSaveConversation from './utils/extractAndSaveConversation';
import move from './utils/move';
import { directions, selectors } from './constants/selectors';
import * as fs from 'fs';

const { main: mainDirection, google } = directions;
const { moveSelectors } = selectors;

function getRandomWaitTime(min = 9000, max = 34000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const folderName = 'conversationsJson';
if (!fs.existsSync(folderName)) {
  fs.mkdirSync(folderName);
}

const main = async (page: Page) => {
  do {
    await move(page);
    await new Promise(resolve => setTimeout(resolve, getRandomWaitTime(2200, 4400)));

    const chats = await getChats(page);
    if (chats && chats.length > 0) {
      for (const { chat, menuButton } of chats) {
        const newMessage = await isNewMessage(page, chat);
        if (newMessage) {
          await chat.click();
          await new Promise(resolve => setTimeout(resolve, getRandomWaitTime(2200, 4400)));
          
          const filePath = `${folderName}/conversacion_${Date.now()}.json`;
          await new Promise(resolve => setTimeout(resolve, getRandomWaitTime(13000, 23000))); 
          const conversation = await extractAndSaveConversation(page, filePath);
          
          const switcherResult = await switcher(page, conversation);

          if (switcherResult === 'Noti' && menuButton) {
            try {
              await menuButton.click();
            
              // Esperar para asegurar que el menú esté completamente visible
              await new Promise(resolve => setTimeout(resolve, 1000));
            
              // Ejecutar en el contexto de la página para asegurar que el botón de "Archive chat" esté accesible
              const archiveButtonFound = await page.evaluate(() => {
                const archiveButton = Array.from(document.querySelectorAll('div[role="menuitem"]'))
                  .find((element) => (element as HTMLElement).innerText.includes('Archive chat'));
                
                if (archiveButton) {
                  (archiveButton as HTMLElement).click();
                  return true;
                }
                return false;
              });
          
              if (archiveButtonFound) {
                console.log("Chat archivado con éxito.");
              } else {
                console.log("No se encontró el botón de 'Archive chat'.");
              }
          
            } catch (err) {
              console.error("Error al intentar archivar el chat:", err);
            }
          }
                    

          await new Promise(resolve => setTimeout(resolve, getRandomWaitTime(2900, 6400)));
        }
      }
    }
    
    try {
      await page.goto('https://www.google.com', { waitUntil: 'networkidle2', timeout: 60000 });

      await new Promise(resolve => setTimeout(resolve, getRandomWaitTime(250000, 700000))); 
    
      await page.goto(mainDirection, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(resolve => setTimeout(resolve, getRandomWaitTime(18000, 37000))); 
    } catch (err) {
      console.error('Error durante la navegación:', err);
    }
  } while (true);
};

export default main;
