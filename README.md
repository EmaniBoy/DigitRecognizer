Handwritten Digit Recognizer

This project is a web application that uses a CNN model to recognize handwritten digits (0-9) 
drawn by users or uploaded as image files. The model predicts the digit along with the confidence level of 
each possible outcome, and a probablity distribution bar graph for each number. The CNN model achieved 97% accuracy
and is trained and tested on MNIST data, https://storage.googleapis.com/tensorflow/tf-keras-datasets/mnist.npz
Built with React, Vite, JavaScript, Python, TensorFlow, and a backend API for model inference. 


--Performance Metrics--
1, Model Performance:
  - Training Accuracy: 98.6%
  - Validation Accuracy: 98.12%
  - Test Set Accuracy: 97.69%
  - Confusion Matrix shows strong diagonal performance

2, System Performance:
  - Average API Response Time: ~2.8s
  - Model Size: ~6MB
  - Image Processing Time: ~0.3s
  - Frontend Load Time: <1s

 3, Model Architecture:
  Input Layer: 784 neurons (28x28 flattened)
  Hidden Layers:
  - Dense Layer 1: 128 neurons (ReLU)
  - Dense Layer 2: 64 neurons (Sigmoid)
  - Dense Layer 3: 32 neurons (Sigmoid)
  Output Layer: 10 neurons (Softmax)

<img width="1440" alt="DEMOpic1" src="https://github.com/user-attachments/assets/19e00543-1b10-44e0-8dac-4dfbda2d3abc">

<img width="1440" alt="DEMOpic2" src="https://github.com/user-attachments/assets/9a1d99c6-346f-4267-9e0e-7e80fc76a09a">
