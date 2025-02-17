# Automate Script Puppeteer

This document provides a detailed explanation of the functionality, configuration, and customization of the **Puppeteer** script designed to automate Facebook conversations, integrated with a Python API running AI models. Each module is structured for easy maintenance and adaptation to suit your needs.

---

## Table of Contents

- [Introduction](#introduction)
- [Requirements and Configuration](#requirements-and-configuration)
- [File Structure and Functionality](#file-structure-and-functionality)
  - [index.ts](#indexts)
  - [login.ts](#logints)
  - [main.ts](#maints)
  - [move.ts](#movets)
  - [utils.ts](#utilsts)
  - [extractandsaveconversation.ts](#extractandsaveconversationts)
  - [regex.ts](#regexts)
  - [switcher.ts](#switcherts)
  - [embeddings.ts](#embeddingsts)
  - [docSent.ts (mainDoc)](#docsentts)
  - [responseinit.ts and responsetwo.ts](#responseinitts-and-responsetwots)
  - [responseAPI.ts](#responseapits)
  - [noti.ts](#notits)
- [General Considerations](#general-considerations)
- [Customization and Modifications](#customization-and-modifications)
- [Execution and Usage](#execution-and-usage)

---

## Introduction

The script automates Facebook conversations and is integrated with a Python API that executes AI models. It is capable of:

- Automating Facebook login and cookie management.
- Navigating and interacting with the chat window, either in **Marketplace** mode or **Ads** mode (configurable via the `marketplace` variable in the `.env` file).
- Extracting and saving conversations as JSON files for later analysis.
- Detecting automated responses using customizable regular expressions.
- Integrating with a Python API to retrieve AI-generated responses and perform specific actions:
  - Sending documents (PDFs, photos, etc.).
  - Sending automated responses (initial or follow-up messages).
  - Sending notifications via Telegram to alert the seller.

---


##  Project Structure

```plaintext
- functions
  - constants
    - selectors.ts        # CSS Selectors and XPaths used by Puppeteer
    - settings.ts         # General bot settings
    - text.ts             # Predefined texts and messages

  - switch                # Switcher module that manages responses
    - disp.ts             # Automatic response function
    - embeddings.ts       # Function to send text to the OpenAI API
    - images.ts           # Function to send images and responses
    - noti.ts             # Function to notify via Telegram
    - repr.ts             # Automatic response function
    - switcher.ts         # Orchestrates all the above functions

  - utils
    - extractAndSaveConversation.ts  # Extracts and saves conversations
    - move.ts                        # Accesses Messenger and navigates chats
    - save.ts                        # Saves conversations to JSON
    - timer.ts                       # Timer functions
    - utils.ts                       # Utilities to identify chats and new messages

- index.ts            # Main entry point, calls login and main
- login.ts            # Logs into Facebook, saves and loads cookies
- main.ts             # Heart of the bot, coordinates modules and workflow
```


## Requirements and Configuration

Before running the script, ensure that:

- [Node.js](https://nodejs.org/) is installed along with necessary dependencies (Puppeteer, Axios, etc.).
- You have created a `.env` file in the project root with the following variables (plus any additional settings you require):

  - **Login Details:**
    - `USERNAME` and `PASSWORD` for Facebook authentication.
  - **Navigation Mode:**
    - `marketplace` → `true` or `false` (determines which chat window the script navigates to).
  - **Headless Option:**
    - In `selector.ts`, **set** the `headless` variable to `false` to allow manual login if Facebook requests a captcha.
  - **Telegram Notifications:**
    - `BOT_TOKEN` and `CHAT_ID` for integration with Telegram in the `noti.ts` module.

---

## File Structure and Functionality

Below is an explanation of each file/module and its purpose:

### index.ts
- **Purpose:** Entry point of the script.
- **Description:** Initializes the process and calls the necessary modules.

---

### login.ts
- **Purpose:** Manages Facebook login.
- **Process:**
  - Checks for existing cookies.
  - If cookies are absent, logs in using the credentials provided in the `.env` file.
- **Captcha Handling:**
  - If Facebook requests a captcha, **comment out** the following lines to avoid blocks:
    ```ts
    await page.type(loginSelectors.userSelector, username);
    await getHumanizedWaitTime(45000, 6500);

    await page.type(loginSelectors.passwordSelector, password);
    await page.keyboard.press('Enter');

    await getHumanizedWaitTime(4000, 6000);
    ```
  - Add a waiting period of **1 minute** for manual login.
  - **Important:** Change the `headless` variable to `false` in `selector.ts`.

---

### main.ts
- **Purpose:** Main loop of the script.
- **Description:** Keeps the process running continuously. This module should remain unchanged to maintain system stability.

---

### move.ts
- **Purpose:** Navigates to the chat window.
- **Configuration:**
  - Checks the `marketplace` variable in the `.env` file:
    - If `false`, it navigates to the main conversation window (Ads mode).
    - If `true`, it navigates to the Marketplace window.

---

### utils.ts
- **Purpose:** Contains utility functions.
- **Key Example:**
  - **New Message Check:**
    ```ts
    const isNewMessage = async (page: Page, chat: ElementHandle<Element>): Promise<boolean | null> => {
      const evaluateChat = await page.evaluate((chat, sel) => {
        const messageToEvaluate = chat.querySelector(sel);
        return messageToEvaluate ? true : null;
      }, chat, moveSelectors.blueSelector);
    
      return evaluateChat;
    }
    ```
- **Role:** Facilitates scrolling, conversation extraction, and detection of new messages.

---

### extractandsaveconversation.ts
- **Purpose:** Extracts the current conversation and saves it as a JSON file.
- **Integration:** Calls `regex.ts` to identify and transform automated responses.
- **Customization:**  
  - Users can modify how the conversation is extracted and saved.

---

### regex.ts
- **Purpose:** Analyzes and transforms text based on regular expression patterns.
- **Primary Use:**  
  - Detects automated responses and replaces them with specific tags:
    - `{responseinit1}`, `{responsetwo}`, `{docSent}`
- **Internal Structure:**
  - **Customizable Groups:**  
    - Each group includes:
      - **Prefixes:** Starting phrases.
      - **Suffixes:** Ending phrases.
      - **Replacement:** Tag that replaces the detected text.
  - **Example Configuration:**
    ```ts
    const groups = [
      {
        prefixes: [
          "Hello! Thank you for your interest in our products. We currently have ",
          "Good day! We appreciate your inquiry. At the moment we offer "
        ],
        suffixes: [
          " and we are ready to assist you. Could you tell us how you heard about our brand?",
          " and we are here to help. Can you let us know how you came to know about our company?"
        ],
        replacement: "{responseinit1}"
      },
      // ... other groups
    ];
    ```
- **Note:**  
  - Customize or add new groups based on your automated response requirements.

---

### switcher.ts
- **Purpose:**  
  - Processes the filtered conversation.
  - Connects with the Python API to get a response based on AI models.
- **Actions Based on Response:**
  - **`SendDoc`:**  
    - If the conversation includes `{docSent}` or does not include `{responseinit1}`, it either sends a notification or calls `mainDoc` after a delay.
  - **`Noti`:**  
    - Sends a Telegram notification using the `noti.ts` module.
  - **`responseinit1` and `responsetwo`:**  
    - Triggers the corresponding modules to send automated responses.
  - **`Answer` (from API):**  
    - Calls `responseAPI.ts` to directly send the generated response.
- **Logging:**  
  - Each conversation and its corresponding cluster response are logged in a CSV file for tracking.

---

### embeddings.ts
- **Purpose:**  
  - Sends the conversation to the Python API.
  - Receives the processed response (either a string or an object containing an action and response).
- **Example Usage:**
  ```ts
  const apiResponse = await axios.post('http://127.0.0.1:8080/find_question', {
      question: conversation
  });
'''
## docSent.ts (mainDoc)
**Purpose:**  
- Sends documents (PDFs, photos, etc.) to the chat.

**Process:**  
- Retrieves the folder path (by default, a single PDF is expected per cluster folder).  
- Uses a file chooser to upload the document.  
- Sends a predefined message (configurable via `text.sendPhotos` or `text.sendPhotosLocation`).

**Note:**  
- The default setup allows only one PDF per conversation. Customize as needed.

---

## responseinit.ts and responsetwo.ts
**Purpose:**  
- Sends basic automated responses (for first contact and follow-up) as configured in the `.env` file.

**Process:**  
- Simulates typing into the chat input.

**Example:**
```ts
await page.type(textbox, text.responseinit1);
```

## responseinit.ts and responsetwo.ts

**Customization:**  
- Adjust the texts in the constants file (`text.ts`) or directly in the `.env` according to your communication strategy.

---

## responseAPI.ts

**Purpose:**  
- Sends the response provided directly by the Python API, typically from a generative AI model.

**Process:**  
- Takes the `responseText` and sends it to the chat.

**Example:**
```ts
await page.type(messageSelectors.textInputSelector, responseText);
await page.keyboard.press('Enter');
```
## noti.ts

**Purpose:**  
- Sends a Telegram notification when the API returns a `Noti` action.

**Requirements:**  
- Set up a Telegram bot (a simple process that takes about 5 minutes) and obtain:
  - **BOT TOKEN**
  - **CHAT ID**  
  These variables must be added to your `.env` file.

**Action:**  
- Sends a message containing the conversation and its title, allowing the seller to review it quickly.

---

## General Considerations

- **Single Document Submission:**  
  The script is designed to send only one document (PDF, photo, etc.) per conversation.

- **Regex Customization:**  
  The `regex.ts` function can be modified to adapt to new automated responses; review it if you add new response types.

- **Python Integration:**  
  Communication with the Python API is done via HTTP requests. Ensure the API is running at the configured address and port.

- **Humanized Waiting Times:**  
  The use of `getHumanizedWaitTime` simulates real interaction, reducing the risk of being flagged as automated.

---

## Customization and Modifications

- **Environment Variables (.env):**
  - Properly configure:
    - Login credentials.
    - Chat mode (`marketplace`).
    - Notification settings (`BOT_TOKEN` and `CHAT_ID`).

- **Login Adjustments:**
  - Comment out the typing lines in `login.ts` if a captcha appears and use manual login.

- **Regex Adjustments:**
  - Customize the prefixes, suffixes, and replacement tags in `regex.ts` according to your automated responses.

- **Paths and Files:**
  - In `docSent.ts`, ensure that the document folder (`doc/clusters`) contains the corresponding PDF and that the cluster name matches.

- **Notifications:**
  - Verify and adjust the `noti.ts` module to ensure your Telegram bot works correctly.

---

## Execution and Usage

1. **Install Dependencies:**
   ```bash
   npm install

## Execution and Usage

1. **Configure the .env File:**  
   - Add the necessary variables (login details, marketplace mode, Telegram notifications, etc.).

2. **Modify Headless Setting:**  
   - Change `headless` to `false` in `selector.ts` if you need manual login in case of captcha.

3. **Run the Script:**
   ```bash
   npm run init

4. Monitor Logs:
- Check the console and the generated CSV/JSON files to ensure proper functioning.

With this detailed documentation and modular structure, the script is highly customizable and adaptable to various Facebook conversation automation scenarios. Adjust each module to suit your specific requirements and enhance customer interaction!

Happy coding!


