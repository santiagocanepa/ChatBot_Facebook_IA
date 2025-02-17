# 📘 README - Integrated Project: Models & API + Puppeteer Script

This repository integrates two main components for automating Facebook conversations:

- **Models & API:**  
  A local Python API (using Flask) that utilizes pre-trained classification models (in `.pkl` format) and the OpenAI API to generate contextual responses.

- **Puppeteer Script:**  
  A Node.js automation script using Puppeteer to handle Facebook interactions (Marketplace or Ads), including login, navigation, conversation extraction, message sending, and integration with the Python API.

---

## Table of Contents

- [📖 Introduction](#-introduction)
- [📂 Project Structure](#-project-structure)
  - [Models & API](#models--api)
  - [Puppeteer Script](#puppeteer-script)
- [⚙️ Requirements and Configuration](#️-requirements-and-configuration)
- [🔄 Workflow and Integration](#-workflow-and-integration)
- [🎨 Customization and Training](#-customization-and-training)
- [🚀 Execution and Testing](#-execution-and-testing)
- [📝 Final Notes and Recommendations](#-final-notes-and-recommendations)

---

## 📖 Introduction

This project integrates a **Python API** and a **Node.js (Puppeteer) script** to automate Facebook conversations. The API processes incoming text, classifies it using machine learning models, and—if necessary—refines the response with OpenAI's GPT. In parallel, the Puppeteer script:

- Automates Facebook login and cookie management.
- Navigates to the appropriate chat window (Marketplace or Ads).
- Extracts and saves conversations as JSON files.
- Sends messages, documents, and notifications (e.g., via Telegram).
- Communicates with the Python API to determine actions such as sending documents, automated responses, or alerts for human intervention.

This solution is designed to optimize communication with customers and prospects by enabling automated responses or human intervention when needed.

---

## 📂 Project Structure

The repository is divided into two main sections:

### Models & API

- **Purpose:** Automates conversation processing using classification models and OpenAI.
- **Contents:**
  - **Pre-trained Models:** `.pkl` files for text classification.
  - **Python Scripts:**
    - `app.py`: Deploys the API.
    - `utils.ts` & `utilsgpt.py`: Contain logic for text vectorization, classification, and API calls to OpenAI.
    - `promptgeneral.py`: Base prompt for GPT.
    - `testwithGPT.py`: Script for testing and analysis.
  - **System Prompts:** Configuration files for different conversation flows.
  - **requirements.txt:** Lists the required Python dependencies.

**Directory Tree:**

```plaintext
Models & API/
├─ app.py
├─ utils.ts
├─ utilsgpt.py
├─ promptgeneral.py
├─ testwithGPT.py
├─ requirements.txt
├─ Models/
│   ├─ modelresponseinit1Predict.pkl
│   ├─ modelresponsetwoPredict.pkl
│   ├─ modelSendDocPredict.pkl
│   ├─ modelgeneralPredict.pkl
│   ├─ label_encoderresponseinit1.pkl
│   ├─ label_encoderresponsetwo.pkl
│   ├─ label_encoderSendDoc.pkl
│   ├─ label_encodergeneral.pkl
│   ...
└─ system_prompts/
    ├─ SendDoc_prompt.py
    ├─ response_two_prompt.py
    └─ promptgeneral.py
```


### Puppeteer Script

- **Purpose:** Automates Facebook interactions and integrates with the Python API.
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
---



To understand each script in detail, see the README corresponding to each one: 
- [Automate script puppeteer](Automate%20script%20puppeteer/README.md) 
- [Models & API](Models%20&%20API/README.md)

## ⚙️ Requirements and Configuration

### Dependencies

**For the Python API (Models & API):**

- pandas
- numpy
- Flask
- scikit-learn
- pyperclip
- python-dotenv
- xgboost==2.0.3
- openai==0.28.0

**Installation:**

```
pip install -r requirements.txt
```

**For the Puppeteer Script (Node.js):**

- Node.js (v14+)
- Puppeteer
- Axios
- Other dependencies listed in `package.json`

**Installation:**

```
npm install
```

### Environment Variables (.env)

Create a `.env` file in the root of the project with at least the following variables:

- **OpenAI API:**
  - `OPENAI_API_KEY=your_key_here`
- **Facebook Credentials and Navigation:**
  - `USERNAME=your_username`
  - `PASSWORD=your_password`
  - `marketplace=true` or `false` (to determine which chat window to navigate to)
- **Telegram Notifications:**
  - `BOT_TOKEN=your_bot_token`
  - `CHAT_ID=your_chat_id`
- **Additional settings as needed.**

---

## 🔄 Workflow and Integration

The processing workflow is divided into two main phases:

1. **Conversation Processing (Python API):**  
   - **Text Reception:**  
     The API receives a JSON payload with a `question` field (e.g., sent from the Puppeteer script).  
     **Example:**

     ```
     {
       "question": "Hello, I would like to know more about your service. {responseinit1}"
     }
     ```

   - **Classification and Vectorization:**  
     The conversation is categorized based on markers (e.g., `{responseinit1}`, `{responsetwo}`, `{docSent}`) or as a general case.  
     The text is vectorized using OpenAI embeddings (model `"text-embedding-3-large"`).

   - **Prediction and GPT Refinement:**  
     A pre-trained XGBoost model predicts the action. If the prediction is `"Noti"`, the entire conversation is sent to GPT (using `"gpt-4o-mini"`) for further refinement.

2. **Conversation Automation (Puppeteer):**  
   - **Login and Navigation:**  
     The script handles Facebook login and navigates to the proper chat window based on the configuration (Marketplace or Ads).
   - **Message Extraction and Sending:**  
     Conversations are extracted, tagged using regular expressions (e.g., inserting `{responseinit1}`, `{responsetwo}`, `{docSent}`), and sent to the API.
   - **Actions and Notifications:**  
     Based on the API response, the script sends automated messages, uploads documents, or triggers Telegram notifications for human intervention.

---

## 🎨 Customization and Training

### Models & API

- **Model Training:**  
  - Label your own conversations and train models (e.g., using XGBoost).
  - Save your models and LabelEncoders in `.pkl` format.
  - Update the file paths in `utils.ts` as needed.

- **Prompt Customization:**  
  - Edit `promptgeneral.py` to adjust GPT directives to your business flow.

### Puppeteer Script

- **Navigation and Extraction Adjustments:**  
  - Customize selectors and waiting times in `move.ts`, `login.ts`, and `utils.ts`.
  - Modify `regex.ts` to fit the patterns for automated responses you need.

- **Notification Setup:**  
  - Configure the `noti.ts` module to ensure proper integration with Telegram for alerts.

---

## 🚀 Execution and Testing

### Running the Python API (Models & API)

1. **Install Python dependencies:**

   ```
   pip install -r requirements.txt
   ```

2. **Configure your `.env` file** as described above.

3. **Run the API:**

   ```
   python app.py
   ```

   The API will be deployed at `http://0.0.0.0:8080`.

4. **Test the API:**  
   Send a test request (using curl or Postman):

   ```
   curl -X POST -H "Content-Type: application/json" \
   -d '{"question": "Hello, I am interested in the information {responseinit1}"}' \
   http://127.0.0.1:8080/find_question
   ```

5. **Additional Testing:**  
   Use `testwithGPT.py` to generate reports and CSV files with predictions.

### Running the Puppeteer Script

1. **Install Node.js dependencies:**

   ```
   npm install
   ```

2. **Configure your `.env` file** with required variables (credentials, navigation mode, notifications, etc.).

3. **Run the script:**

   ```
   npm run init
   ```

4. **Monitor Logs and Outputs:**  
   Check console outputs and generated CSV/JSON files to verify correct operation.

---

## 📝 Final Notes and Recommendations

- **OpenAI Costs:**  
  Be aware of the costs associated with using OpenAI embeddings and GPT calls. Adjust call frequency as needed to control expenses.

- **Model Persistence:**  
  Storing models in `.pkl` format reduces inference time and avoids recalculating large vectors.

- **Hybrid Architecture:**  
  Combining a fast classifier (XGBoost) with a secondary GPT review achieves a balance between speed and accuracy.

- **Consistent Integration:**  
  Maintain consistency between the markers used in the Puppeteer script and the classification logic in the API. Update both if you change tags like `{responseinit1}` or `{docSent}`.

- **Humanized Automation:**  
  Use human-like waiting times and proper error handling (e.g., for Facebook login captchas) to reduce the risk of being flagged as automated.

- **Notifications and Tracking:**  
  Ensure Telegram notifications are properly configured so that sales teams are alerted when human intervention is required.

---

Ready to get started? With this comprehensive documentation, you can customize, train, and deploy a robust solution for automating Facebook conversations by leveraging both AI and web automation.

Happy coding! 🚀
