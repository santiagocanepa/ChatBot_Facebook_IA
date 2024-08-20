import { Page } from 'puppeteer';
import disp from './disp';
import mainImages from './images';
import { noti } from './noti';
import repr from './repr';
import { embeddings } from './embeddings';
import { selectors } from '../constants/selectors';
import fs from 'fs';

const csvFilePath = '/home/santiago/Bots/Msg Facebook/EmbeddingReplyBot/Conversations_reales.csv';

function getRandomWaitTime(min = 27000, max = 64000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function switcher(page: Page, conversation: string): Promise<string> {
    // Si la conversación contiene menos de 5 caracteres
    const cleanConversation = conversation.replace(/{Oferta Inicial}|{Oferta Inicial2}|{Fotos enviadas}|{SI}/g, '');
    if (cleanConversation.length <= 5) {
        return "NoAction";
    }

    const presentationText = await page.evaluate(() => Array.from(document.querySelectorAll('div[role="presentation"]')).map(div => (div as HTMLElement).innerText).join(' ').trim());
    if (presentationText.includes('sold') || presentationText.includes('removed the item') || presentationText.includes('changed the price')) {
        return "NoAction";
    }

    const cluster = await embeddings(conversation);
    const title = await page.evaluate((TitleSelector) => {
        const titleElement = document.querySelector(TitleSelector);
        const ariaLabel = titleElement?.getAttribute('aria-label');
        return ariaLabel ? ariaLabel.substring('Conversation titled'.length).trim() : "Título no encontrado";
    }, selectors.messageSelectors.TitleSelector);

    let result = "NoAction"; // Valor por defecto

    switch (cluster.response) {
        case 'Envio Fotos':
            if (conversation.includes('{Fotos enviadas}') || !conversation.includes('{Oferta Inicial}')) {
                await noti(title, conversation);
                result = "Noti";
            } else {
                await new Promise(resolve => setTimeout(resolve, getRandomWaitTime(37000, 78000))); 
                await mainImages(page, 'Envio_Fotos');
            }
            break;

        case 'Noti':
            await noti(title, conversation);
            result = "Noti";
            break;

        case 'Noti Ventas':
            await noti(title, conversation);
            result = "Noti";
            break;

        case 'RERP':
            if (conversation.includes('REPR') || conversation.includes('{Oferta Inicial}')) {
                await noti(title, conversation);
                result = "Noti";
            } else {
                await new Promise(resolve => setTimeout(resolve, getRandomWaitTime(14000, 24000))); 
                await repr(page);
            }
            break;

        case 'Disp':
            if (conversation.includes('SI') || conversation.includes('{Oferta Inicial}')) {
                await noti(title, conversation);
                result = "Noti";
            } else {
                await new Promise(resolve => setTimeout(resolve, getRandomWaitTime(14000, 24000))); 
                await disp(page);
            }
            break;

        default:
            result = "NoAction";
            break;
    }

    const csvLine = `"${conversation.replace(/"/g, '""')}","${JSON.stringify(cluster).replace(/"/g, '""')}"\n`;
    fs.appendFileSync(csvFilePath, csvLine, 'utf8');

    return result; // Retornar el resultado
}
