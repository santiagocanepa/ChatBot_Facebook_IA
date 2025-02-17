import { Page } from 'puppeteer';
import responseinit1 from './responseinit1';
import mainDoc from './docSent';
import { noti } from './noti';
import responsetwo from './responsetwo';
import { embeddings } from './embeddings';
import { selectors } from '../constants/selectors';
import fs from 'fs';
import  {responseAPI} from './responseAPI';
import { getHumanizedWaitTime } from '../utils/timer';

const csvFilePath = '/home/santiago/Bots/Msg Facebook/ChatBot_Facebook_IA/Conversations_reales.csv';



interface AnswerResponse {
    action: "Answer";
    response: string;
}

type ApiResponse = string | AnswerResponse;

export async function switcher(page: Page, conversation: string): Promise<string> {
    const cleanConversation = conversation.replace(/{responseinit1}|{responsetwo}|{docSent}|{SI}/g, '');
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

    let result = "NoAction"; 
    if (typeof cluster.response === 'string') {
        switch (cluster.response) {
            case 'SendDoc':
                if (conversation.includes('{docSent}') || !conversation.includes('{responseinit1}')) {
                    await noti(title, conversation);
                    result = "Noti";
                } else {
                    await getHumanizedWaitTime(37000, 78000); 
                    await mainDoc(page, 'cluster');
                }
                break;

            case 'Noti':
                await noti(title, conversation);
                result = "Noti";
                break;


            case 'responsetwo':
                if (conversation.includes('responsetwo')) {
                    await noti(title, conversation);
                    result = "Noti";
                } else {
                    await getHumanizedWaitTime(14000, 24000); 
                    await responsetwo(page);
                }
                break;

            case 'responseinit1':
                if ( conversation.includes('{responseinit1}')) {
                    await noti(title, conversation);
                    result = "Noti";
                } else {
                    await getHumanizedWaitTime(14000, 24000)
                    await responseinit1(page);

                }
                break;

            default:
                result = "NoAction";
                break;
        } 
    } else if (typeof cluster.response === 'object' && cluster.response !== null) {
        const apiResponse = cluster.response as AnswerResponse;
        switch (apiResponse.action) {
            case 'Answer':
                await responseAPI(page, apiResponse.response);
                result = "Noti";
                break;

            default:
                result = "NoAction";
                break;
        }
    }
    const csvLine = `"${conversation.replace(/"/g, '""')}","${JSON.stringify(cluster).replace(/"/g, '""')}"\n`;
    fs.appendFileSync(csvFilePath, csvLine, 'utf8');

    return result; 
}
