import requests
import json
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt

# Definir la URL de la API local
url = "http://127.0.0.1:8080/find_question"

# Cargar el CSV de testeo
df_test = pd.read_csv('test_ventas.csv')

# Definir una función para obtener la respuesta de la API
def get_api_response(question):
    response = requests.post(url, json={'question': question})
    if response.status_code == 200:
        return response.json().get('response', 'No response')
    else:
        print(f"Error {response.status_code}: {response.text}")
        return 'Error'

# Obtener las respuestas predichas por la API
df_test['predicted_respuesta'] = df_test['conversation'].apply(get_api_response)

# Imprimir el reporte de clasificación
print("Reporte de clasificación:\n", classification_report(df_test['respuesta'], df_test['predicted_respuesta']))

# Matriz de confusión
cm = confusion_matrix(df_test['respuesta'], df_test['predicted_respuesta'], labels=df_test['respuesta'].unique())
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=df_test['respuesta'].unique())
disp.plot(cmap=plt.cm.Blues)
plt.show()

# Guardar el DataFrame con las predicciones
df_test.to_csv('test_ventas_with_predictions.csv', index=False)
print("Archivo test_ventas_with_predictions.csv guardado correctamente.")
