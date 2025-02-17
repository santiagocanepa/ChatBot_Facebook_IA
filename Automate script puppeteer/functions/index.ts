import login from './login';
import main from './main';

async function init() {
  const { browser, page } = await login();
  try {
    await main(page); 
  } catch (err) {
    await browser.close();
    console.error(err);
    throw new Error(err as string);
  }
}

init().catch((err) => console.error(err));
