from tensorflow.keras.models import load_model
import numpy as np
import pickle

# Load the model and tokenizer
model = load_model('next_words.h5')
tokenizer = pickle.load(open('token.pkl', 'rb'))
# we store this tokenizer to use in our javascript code
for value , key in tokenizer.word_index.items():
    print(key , value)

def Predict_Next_Words(model, tokenizer, text):
  #change the query to sequence
  sequence = tokenizer.texts_to_sequences([text])
  sequence = np.array(sequence)
  preds = np.argmax(model.predict(sequence))
  predicted_word = ""
  #detect the predicted word
  for key, value in tokenizer.word_index.items():
      if value == preds:
          predicted_word = key
          break
  
  print(predicted_word)
  return predicted_word

while(True):
  # testing the model
  text = input("Enter your line: ")
  
  if text == "STOP":
      print("Execution completed!")
      break
  
  else:
      try:
          text = text.split(" ")
          text = text[-3:]
          print(text)
        
          Predict_Next_Words(model, tokenizer, text)
      except Exception as e:
        print("Error occurred: ",e)
        continue