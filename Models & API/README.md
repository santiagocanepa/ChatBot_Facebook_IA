# README - Folder: Models & API

This README provides a detailed description of the configuration, usage, and customization of the Python script designed to automate Facebook conversations (or any other platform) by using classification models and the OpenAI API to generate more contextual responses.

The **Models & API** folder contains:

- Pre-trained `.pkl` models (for text classification).
- Python scripts to deploy and consume the local API.
- System prompts used in the different conversation classes.
- Utility files to generate embeddings, process the conversational flow, and communicate with OpenAI.

Below, each file is detailed and instructions for customization are provided.

---

## Table of Contents

- [General Description](#general-description)
- [File Structure](#file-structure)
- [Requirements and Dependencies](#requirements-and-dependencies)
- [Environment Variables](#environment-variables)
- [Explanation of Key Files](#explanation-of-key-files)
  - [app.py](#1-apppy)
  - [utils.ts](#2-utilsts)
  - [testwithGPT.py](#3-testwithgptpy)
  - [promptgeneral.py](#4-promptgeneralpy)
  - [utilsgpt.py](#5-utilsgptpy)
  - [requirements.txt](#6-requirementstxt)
- [Workflow: How Conversations Are Processed](#workflow-how-conversations-are-processed)
- [Customization and Model Training](#customization-and-model-training)
- [Execution and Testing](#execution-and-testing)
- [Final Notes and Recommendations](#final-notes-and-recommendations)

---

## General Description

This project implements a local API in Python (using Flask) that receives text corresponding to a conversation (for example, from a Puppeteer script that automates Facebook Messenger). Once the API receives the conversation:

- **Identification of the Conversation Category:**  
  It identifies the conversation category based on certain markers (for example, `{responseinit1}`, `{responsetwo}`, `{docSent}`) or classifies it more generically into the general class.
- **Vectorization of the Text:**  
  It vectorizes the text using OpenAI embeddings (model `"text-embedding-3-large"`).
- **Model Selection:**  
  Depending on the category, it uses a specific model (pre-trained with XGBoost) to determine the best response (or action).
- **Review with GPT (Optional):**  
  If the predicted response is `"Noti"`, the conversation is sent again to a GPT model (specified as `"gpt-4o-mini"` in the code) for a second classification or to generate a final response text.

The goal is to automate and optimize responses, detecting whether the conversation requires sending a document (e.g., `SendDoc`), if it is an initial query (`responseinit1`), a second response (`responsetwo`), or if a human agent needs to be notified (`Noti`) to intervene.

---

## File Structure

Within the **Models & API** folder, you will find:

- **Pre-trained Models:**  
  Files with the extension `.pkl` used for text classification.
- **Python Scripts:**  
  Scripts to deploy and consume the local API.
- **System Prompts:**  
  Files containing system prompts for various conversation classes.
- **Utility Files:**  
  For generating embeddings, processing the conversation flow, and communicating with OpenAI.

**Directory Tree:**

```
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

---

## Requirements and Dependencies

The main dependencies are listed in `requirements.txt`:

- **pandas**
- **numpy**
- **Flask**
- **scikit-learn**
- **pyperclip**
- **python-dotenv**
- **xgboost==2.0.3**
- **openai==0.28.0**

**Installation:**

```
pip install -r requirements.txt
```

---

## Environment Variables

Before running the API, you need to configure the following environment variables (usually in a `.env` file at the root of the project):

- **OPENAI_API_KEY:**  
  Your OpenAI key to be able to make calls to the embeddings API and the GPT model.

**Example `.env`:**

```
OPENAI_API_KEY=your_key_here
```

*Make sure not to share or upload this key to public repositories.*

---

## The repository includes a Jupyter Notebook that explains, step by step:
You can also edit and run it in the following link: [JupyterNotebook](https://www.kaggle.com/code/ivancanepa/ai-conversational-tagging-with-openai-xgboost/)
- How to extract and clean conversation data.
- How embeddings are applied.
- How XGBoost is trained.
- How the final model is serialized for production.



## Explanation of Key Files

### 1. app.py

This file deploys the API and handles incoming requests.

**Code:**

```
import openai
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from utils import find_similar_question
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

@app.route('/find_question', methods=['POST'])
def handle_find_question():
    data = request.get_json()
    question = data['question']
    try:
        response = find_similar_question(question)
        if isinstance(response, dict):
            return jsonify(response=response)
        else:
            return jsonify(response=response)
    except Exception as e:
        logging.exception("Error processing request")
        return jsonify(error=str(e)), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

- **Deploys a local API** on port 8080.
- Exposes a POST endpoint `/find_question` that receives a JSON with the key `question`, corresponding to the conversation text.
- Internally calls the function `find_similar_question(...)` defined in `utils.ts`.
- Returns the response in JSON format, whether it is a string or a dictionary.

---

### 2. utils.ts

This file contains the main logic for:

- **Loading Models:**  
  Loads XGBoost models and LabelEncoders from the `Models/` folder.
- **Creating Embeddings:**  
  Utilizes the OpenAI API to create embeddings via the function `create_embeddings_batch`.
- **Calculating Weights:**  
  Uses `get_weighted_embedding` to calculate weights for the last part of the conversation.
- **Text Classification:**  
  Contains the function `classify_text` to classify text based on markers and extract relevant parts (e.g., after `{responseinit1}` or `{docSent}`).
- **Prediction and GPT Integration:**  
  Predicts the class and, if the prediction is `"Noti"` in certain categories, calls GPT (via `process_conversation` in `utilsgpt.py`).

**Notable and Customizable Points:**

- **Embeddings Dimension:**  
  `EMBEDDING_SIZE = 3072`.
- **Embeddings Model:**  
  `"text-embedding-3-large"`.
- **Markers and Categories:**  
  `responseinit1`, `responsetwo`, `SendDoc`, `general`.
- **Function `get_weights(...)`:**  
  Adjusts the weighting percentages of final or initial words according to the conversation's total length.
- **System Prompts:**  
  Prompts such as `SendDoc_SYSTEM_PROMPT`, `response_two_SYSTEM_PROMPT`, and `general_SYSTEM_PROMPT` are imported to customize GPT responses based on the category.

The core function `find_similar_question(input_text)`:

- **Classifies the text.**
- **Vectorizes the text** using the appropriate method (direct or weighted).
- **Obtains and applies the appropriate model**.
- **Predicts the response.**
- If the prediction is `"Noti"` for certain categories (e.g., `SendDoc` or `responsetwo`), the entire conversation is sent to GPT for refinement or final response generation.

---

### 3. testwithGPT.py

This script tests the API's behavior, particularly when the expected real class is `"Noti"`.

**Code:**

```
import requests
import json
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt
```

- **Local API URL:**

```
url = "http://127.0.0.1:8080/find_question"
```

- Reads a CSV of tests, filters samples, sends them to the API, and analyzes the results.
- Saves predictions in `test_with_predictions_sampled.csv`.
- Sends a sample of conversations to the API and compares the response with the actual label (`respuesta`).
- Generates a classification report and saves the results in a CSV.

---

### 4. promptgeneral.py

This file contains the base prompt for GPT when the category is unknown or when more general processing is required.

**Code:**

```
general_SYSTEM_PROMPT = ```'
Your task is to act as an assistant in conversations with prospects of our brand who inquired through an advertisement.

You will receive a whole conversation, which can be in different instances, our sales process is initial contact with a question or inquiry, second message with a second inquiry question and in the third message we usually send a doc and then call. Sometimes the call may be made earlier if the prospect requests it or is very interested:

You should classify the conversation into the following categories. 

“Notify": conversations that require the intervention of the sales manager, it is usually used in more advanced instances of the conversation, or in cases where the prospect shows significant interest, when in doubt always classify like this.
“respuestainit1": This category should be assigned for initial instances of the conversation, in the prospect's first question.
“responsetwo": This category should be assigned for conversations that are in second message, that is after the salesperson or company gave the first answer, and in cases where the prospect shows moderate interest, because if the interest is significant, as you know it should go to Notify.
“Null": This category should only be used when after receiving a response from the salesperson, the prospect retracts, either because he/she sent the query by mistake or is not interested.
“SendDoc": This category should be assigned in cases where a response has already been sent, where the prospect is usually asked if he/she can be called, and prefers to receive information by this means.
“Respose” (Write an answer, use this only in initial instances, in cases <thinking> 
1. Read and understand the flow of the conversation. 
2. Determine the action to take based on the state and content of the conversation. 
3. If the action is Null or Notify, exit the thinking towards the next part of your output to fill the <action> and <response> fields. 
4. If the action is "Respose", plan (but do not execute) an appropriate response based on the guidelines. 
5. Execute the response in the designated part of the output. 
</thinking>

<action> Action to take...
</action>

<response> ...
</response>  ```'
```

- Provides directives on how to structure the output in `<thinking>`, `<action>`, and `<response>`.
- **Important:** Customize it according to your business flow, class names, and the desired writing style for GPT.

---

### 5. utilsgpt.py

This file makes the call to the OpenAI API to obtain the classification or response generated by GPT, based on the provided system prompt.

**Code:**

```
import openai

def process_conversation(conversation, system_prompt, model="gpt-4o-mini", temperature=0.2, max_tokens=5000):
    ...
    # Call to openai.ChatCompletion
    # Extracts <thinking>, <action> and <response> from the content.
    ...
```

- **Returns a Dictionary** with the keys:
  - `"thinking"`: Describes the internal process as explained by GPT.
  - `"action"`: One of `["Null", "Notify", "Respose", "Error"]`.
  - `"response"`: Final content when the action is `"Respose"`.

**Customization Options:**

- Modify the model (e.g., `gpt-3.5-turbo` or another version of GPT-4).
- Adjust `temperature` and `max_tokens` as per your needs.

---

### 6. requirements.txt

This file lists the required dependencies for the project.

**Installation:**

```
pip install -r requirements.txt
```

---

## Workflow: How Conversations Are Processed

1. **Reception of Text:**
   - The Puppeteer script (or your external program) sends a JSON with the conversation to the `/find_question` endpoint.

   **Example JSON:**

   ```
   {
     "question": "Hello, I would like to know more about your service. {responseinit1}"
   }
   ```

2. **Initial Classification:**
   - Markers such as `{responseinit1}`, `{responsetwo}`, `{docSent}`, etc. are identified.
   - If no markers are detected, the conversation falls into the general class.

3. **Vectorization:**
   - **General Class:**  
     A weighted embedding is performed using `get_weighted_embedding`.
   - **Specific Classes (SendDoc, responseinit1, responsetwo):**  
     A direct embedding of the relevant text (after the marker) is performed.

4. **Prediction with XGBoost:**
   - The appropriate model and its corresponding LabelEncoder are loaded.
   - The response is predicted (e.g., `["Noti"]`, `["SomeResponse"]`, etc.).

5. **Review with GPT (Optional):**
   - If the prediction is `"Noti"` for specific categories, the entire conversation is sent to GPT with the appropriate prompt.
   - GPT determines whether to:
     - **Notify** a human (`"Notify"`).
     - **Directly generate a response** (`"Respose"`).
     - Return `"Null"` if no further action is needed.

6. **Return of the Response:**
   - If the response is a dictionary with keys `{ "action": "...", "response": "..." }`, it is processed in the Puppeteer script to execute the appropriate action (`"Noti"`, `"Respose"`, etc.).
   - If the response is a simple string, it is processed directly.

---

## Customization and Model Training

This folder includes 4 example models:

- `modelresponseinit1Predict.pkl`
- `modelresponsetwoPredict.pkl`
- `modelSendDocPredict.pkl`
- `modelgeneralPredict.pkl`

Each model comes with its respective LabelEncoder.

**Important:**

- These models are not universal for all cases.
- **Ideal Workflow:**
  - Obtain relevant conversations.
  - Assign categories (e.g., `responseinit1`, `responsetwo`, `SendDoc`, `general`, etc.).
  - Vectorize the conversations using OpenAI embeddings or another method.
  - Train an XGBoost model (or another preferred model).
  - Save the model and LabelEncoder with `joblib.dump(...)`.
  - Update the paths to your own `.pkl` files in `utils.ts`.

The repository includes a Jupyter Notebook that explains, step by step:

- How to extract and clean conversation data.
- How embeddings are applied.
- How XGBoost is trained.
- How the final model is serialized for production.

**Note:**

- If you change the name of a class (for example, from `SendDoc` to `EnviarDocumento`), update both the code in `utils.ts` and the Puppeteer script (which detects markers like `{docSent}`, `{responseinit1}`, etc.).
- Adjust the embeddings model as needed. The script is configured for `"text-embedding-3-large"` (dimension 3072), but you may change it to `"text-embedding-ada-002"` or another model, as long as you adapt `EMBEDDING_SIZE`.

---

## Execution and Testing

1. **Install Dependencies:**

```
pip install -r requirements.txt
```

2. **Configure your OpenAI Key in `.env`:**

```
OPENAI_API_KEY=your_key_here
```

3. **Run the API:**

```
python app.py
```

- The API will be deployed at `http://0.0.0.0:8080`.

4. **Send Test Requests:**

   For example, using curl or Postman:

```
curl -X POST -H "Content-Type: application/json" \
-d '{"question": "Hello, I am interested in the information {responseinit1}"}' \
http://127.0.0.1:8080/find_question
```

5. **Test with `testwithGPT.py`:**
   - Ensure that the test CSV (e.g., `df_test`) includes the columns:
     - `conversation`
     - `respuesta` (with the true label)
   - Run the script:

```
testwithGPT.py
```

- A file named `test_with_predictions_sampled.csv` will be generated with the predictions.

---

## Final Notes and Recommendations

- **OpenAI Costs:**  
  When using embeddings and calling GPT, consider the associated costs based on your plan. Adjust the models and filtering levels to minimize API calls.
  
- **Persist Your Model in `.pkl`:**  
  Saving the model in `.pkl` format avoids storing large vectors and reduces inference time.
  
- **Architecture:**  
  This approach combines:
  - A fast classifier (XGBoost) that handles most cases.
  - A secondary call to GPT only in cases of high uncertainty (when the label is `"Noti"`).
  
- **Weighting Conversation Segments:**  
  You can fine-tune the logic in `utils.ts` (using `get_weights` and `get_weighted_embedding`) to prioritize the final parts of the message more or less.
  
- **Integration with Puppeteer:**  
  The Puppeteer script can inject markers like `{responseinit1}`, `{responsetwo}`, `{docSent}` into the text sent to the API, enabling `utils.ts` to process the conversation instance correctly.
  - If you change the markers or the detection logic, ensure consistency between the Puppeteer script and the API.

---

That's it! With these instructions, you should be able to customize, train, and deploy the API that intelligently automates responses using classification models and the OpenAI API.

For more details on intermediate steps (such as data labeling or integration with Facebook Messenger), review the example Jupyter Notebook and the documentation of your Puppeteer script.

Thank you for using this project!  
If you have any additional questions, feel free to consult the provided Jupyter Notebook or contact me.
