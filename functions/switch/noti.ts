import fetch, { RequestInit } from 'node-fetch';
import AbortController from 'abort-controller';

const botToken = process.env.BOTTOKEN;
const chatId = process.env.CHATID;

async function sendNotification(message: string, conversation: string): Promise<void> {
    const fullMessage = `${conversation}\n\n${message}`;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(fullMessage)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, 40000); // 40 segundos de timeout

    try {
        const response = await fetch(url, {
            signal: controller.signal as unknown as RequestInit['signal']
        });
        clearTimeout(timeout);
        const data = await response.json();
        if (data.ok) {
            const { username } = data.result.from;
            const { text } = data.result;
            console.log('Notificación enviada:', { username });
        } 
    } catch (error: any) { // Especificar que el tipo de error es 'any'
        clearTimeout(timeout); // Asegúrate de limpiar el timeout en caso de error también.
        if (error.name === 'AbortError') {
            console.error('La solicitud fue abortada debido al timeout');
        } 
        throw error;
    }
}

export async function noti(title: string, conversation: string): Promise<void> {
    const maxRetries = 502;
    const retryDelay = 1800; // 1.8 segundos de espera entre reintentos
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            await sendNotification(title, conversation);
            break; // Salimos del bucle si la notificación se envía con éxito
        } catch (error) {
            attempts++;
            if (attempts < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
                console.error('Todos los reintentos fallaron.');
            }
        }
    }
}





