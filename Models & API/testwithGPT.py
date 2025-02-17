# test_script.py

import requests
import json
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt

# Define the local API URL
url = "http://127.0.0.1:8080/find_question"

# Load the test CSV
df_test = pd.read_csv('.')

# Filter to only include samples where 'respuesta' is 'Noti'
df_noti = df_test[df_test['respuesta'] == 'Noti']

# Define the sample size
TOTAL_SAMPLES = 30

# Check that there are enough samples
if len(df_noti) < TOTAL_SAMPLES:
    print(f"Warning: There are only {len(df_noti)} samples with 'respuesta' == 'Noti'. All available samples will be used.")
    df_sampled = df_noti
else:
    # Seed for reproducibility
    random_seed = 152
    # Select random samples
    df_sampled = df_noti.sample(n=TOTAL_SAMPLES, random_state=random_seed)

# Define a function to get the API response
def get_api_response(question):
    try:
        response = requests.post(url, json={'question': question}, timeout=10)
        if response.status_code == 200:
            return response.json().get('response', 'No response')
        else:
            print(f"Error {response.status_code}: {response.text}")
            return 'Error'
    except requests.exceptions.RequestException as e:
        print(f"Exception when making the request: {e}")
        return 'Error'

# Initialize lists for true and predicted values
y_true = []
y_pred = []

# Counter for dictionary cases
dict_cases = 0

# Get the predicted responses from the API and process them
print("Sending requests to the API...")
for idx, row in df_sampled.iterrows():
    conversation = row['conversation']
    true_respuesta = row['respuesta']  # Should be 'Noti'
    predicted = get_api_response(conversation)
    
    if isinstance(predicted, dict):
        # Case where the response is a dict
        dict_cases += 1
        action = predicted.get('action', 'NoAction')
        response_text = predicted.get('response', 'No response')
        print(f"\n--- Case {dict_cases} ---")
        print(f"Conversation: {conversation}")
        print(f"Action: {action}")
        print(f"Response: {response_text}")
    else:
        # Case where the response is a string
        y_true.append(true_respuesta)
        y_pred.append(predicted)

# Save the predictions to a new CSV
output_filename = 'test_with_predictions_sampled.csv'
df_sampled['predicted_respuesta'] = df_sampled['conversation'].apply(get_api_response)
df_sampled.to_csv(output_filename, index=False)
print(f"\nFile '{output_filename}' saved successfully.")

# Filter cases where the prediction is not 'Error' and not a dict
# We have already separated the dicts, now we filter 'Error' and exclude 'Responder' if necessary
df_valid = df_sampled[
    df_sampled['predicted_respuesta'].apply(lambda x: isinstance(x, str) and x not in ['Error'])
]

# Extract the predicted responses that are strings
predicted_strings = df_valid['predicted_respuesta']
true_strings = df_valid['respuesta']

# Check that there are valid data for analysis
if len(y_true) == 0:
    print("There are no valid predictions to analyze (all cases were dicts or 'Error').")
else:
    # Print the classification report
    print("\nClassification report for string responses:")
    print(classification_report(y_true, y_pred))
