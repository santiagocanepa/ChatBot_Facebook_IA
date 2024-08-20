import { Page } from 'puppeteer';
import { writeFile } from 'node:fs/promises';
import { selectors } from '../constants/selectors';

const { messageSelectors } = selectors;

const prefixes = [
    "Hola buenas tardes, te interesa permutar por un ",
    "Buenas que tal, te interesa permutar por un "
];
const suffixes = [
    " como nuevo? Muchas gracias.",
    " a tu favor? Muchas gracias.",
    " a mi favor. Muchas gracias."
];


const prefixes2 = ["Esta como nuevo, "];
const suffixes2 = [" Soy de Tigre vos?"];

const prefixes3 = ["Buenas que tal, te sirven "];
const suffixes3 = [" retiro hoy? Muchas gracias."];

function replaceRepetitiveText(text: string): string {
    for (const prefix of prefixes) {
        for (const suffix of suffixes) {
            if (text.includes(prefix) && text.includes(suffix)) {
                const startIndex = text.indexOf(prefix) + prefix.length;
                const endIndex = text.indexOf(suffix, startIndex);
                const ofert = text.substring(startIndex, endIndex).trim();
                const repetitiveText = `${prefix}${ofert}${suffix}`;
                text = text.replace(repetitiveText, "{Oferta Inicial}");
            }
        }
    }

    for (const prefix3 of prefixes3) {
        for (const suffix3 of suffixes3) {
            if (text.includes(prefix3) && text.includes(suffix3)) {
                const startIndex3 = text.indexOf(prefix3) + prefix3.length;
                const endIndex3 = text.indexOf(suffix3, startIndex3);
                const ofert3 = text.substring(startIndex3, endIndex3).trim();
                const repetitiveText3 = `${prefix3}${ofert3}${suffix3}`;
                text = text.replace(repetitiveText3, "{Oferta Inicial2}");
            }
        }
    }
    for (const prefix2 of prefixes2) {
        for (const suffix2 of suffixes2) {
            if (text.includes(prefix2) && text.includes(suffix2)) {
                const startIndex2 = text.indexOf(prefix2) + prefix2.length;
                const endIndex2 = text.indexOf(suffix2, startIndex2);
                const ofert2 = text.substring(startIndex2, endIndex2).trim();
                const repetitiveText2 = `${prefix2}${ofert2}${suffix2}`;
                text = text.replace(repetitiveText2, "{Fotos enviadas}");
            }
        }
    }
    
    if (text.includes("Hola que tal, sisi decime")) {
        text = text.replace("Hola que tal, sisi decime", "SI");
    }

    if (text.includes("Hola si, te interesa mi oferta?")) {
        text = text.replace("Hola si, te interesa mi oferta?", "REPR");
    
    }

    return text;
}

async function extractAndSaveConversation(page: Page, filePath: string): Promise<string> {
  try {
    // Selector para los elementos que contienen el texto de los mensajes
    const messageSelector = messageSelectors.messageContainer;

    // Espera a que los mensajes estén disponibles
    await page.waitForSelector(messageSelector, { timeout: 30000 });
    const messageElements = await page.$$(messageSelector);

    const messages: string[] = [];

    for (const element of messageElements) {
      let text = await element.evaluate((el) => el.textContent || '');
      text = replaceRepetitiveText(text); // Aplicar el reemplazo de texto repetitivo
      messages.push(text);
    }

    // Convierte los mensajes a un solo string
    const conversationText = messages.join('\n');

    // Guarda los mensajes en un archivo JSON
    await writeFile(filePath, JSON.stringify({ messages }, null, 2), 'utf-8');

    return conversationText; // Retorna el texto de la conversación
  } catch (err) {
    console.error('There was an error extracting the conversation: ', err);
    throw new Error(err as string);
  }
}

export default extractAndSaveConversation;

