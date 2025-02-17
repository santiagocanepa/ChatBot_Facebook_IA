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
    }, 40000); 

    try {
        const response = await fetch(url, {
            signal: controller.signal as unknown as RequestInit['signal']
        });
        clearTimeout(timeout);
        const data = await response.json();
        if (data.ok) {
            const { username } = data.result.from;
            const { text } = data.result;
            console.log('Notification sent', { username });
        } 
    } catch (error: any) { 
        clearTimeout(timeout); 
        if (error.name === 'AbortError') {
            console.error('Request aborted due to timeout');
        } 
        throw error;
    }
}

export async function noti(title: string, conversation: string): Promise<void> {
    const maxRetries = 502;
    const retryDelay = 1800; 
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            await sendNotification(title, conversation);
            break; 
        } catch (error) {
            attempts++;
            if (attempts < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
                console.error('all attempts failed');
            }
        }
    }
}





