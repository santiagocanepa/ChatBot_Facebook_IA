import { readFile, writeFile } from 'node:fs/promises';

async function load(path: string): Promise<string> {
  try {
    const data = await readFile(path, 'utf-8');
    return data;
  } catch (err) {
    console.error('There was a problem trying to load the file. Error: ', err);
    throw new Error(err as string);
  }
}

async function save(path: string, data: string): Promise<void> {
  try {
    await writeFile(path, data, 'utf-8');
  } catch (err) {
    console.error('There was a problem trying to save the file. Error: ', err);
    throw new Error(err as string);
  }
}

export { load, save };
