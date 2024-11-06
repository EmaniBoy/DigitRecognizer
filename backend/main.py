# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import logging
from typing import Dict, Any
import sys

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="MNIST Digit Recognizer API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable for the model
model = None

@app.on_event("startup")
async def load_model():
    """Load the MNIST model on startup."""
    global model
    try:
        model = tf.keras.models.load_model('mnist_model.keras')
        logger.info("MNIST model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise RuntimeError(f"Failed to load model: {e}")

# main.py
def process_image(image_data: bytes) -> np.ndarray:
    """Process image data into format expected by model."""
    try:
        # Open and process image
        image = Image.open(io.BytesIO(image_data)).convert('L')
        image = image.resize((28, 28))
        
        # Convert to array and normalize
        img_array = np.array(image)
        
        # Flatten the image to match model's expected input shape (784,)
        img_array = img_array.reshape(1, 784)
        
        # Normalize pixel values
        img_array = img_array / 255.0
        
        logger.info(f"Processed image shape: {img_array.shape}")
        return img_array
        
    except Exception as e:
        logger.error(f"Image processing failed: {e}")
        raise ValueError(f"Failed to process image: {e}")

@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Predict digit from uploaded image.
    Returns prediction, confidence, and probability distribution.
    """
    logger.info(f"Received file: {file.filename}, content_type: {file.content_type}")
    
    if not file.content_type.startswith('image/'):
        logger.error(f"Invalid content type: {file.content_type}")
        raise HTTPException(
            status_code=400,
            detail=f"File must be an image, received {file.content_type}"
        )

    try:
        # Read image data
        image_data = await file.read()
        logger.info(f"Read image data: {len(image_data)} bytes")
        
        # Process image
        img_array = process_image(image_data)
        logger.info(f"Image processed successfully, shape: {img_array.shape}")
        
        # Make prediction
        predictions = model.predict(img_array)
        predicted_class = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_class])
        
        logger.info(f"Prediction made: {predicted_class} with confidence: {confidence:.2%}")
        
        return {
            "prediction": predicted_class,
            "confidence": confidence,
            "probabilities": predictions[0].tolist()
        }
    except ValueError as e:
        logger.error(f"ValueError during prediction: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during prediction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process prediction: {str(e)}"
        )

# Add this function to check model architecture
@app.get("/model-info")
async def get_model_info():
    """Get information about the loaded model architecture."""
    try:
        return {
            "input_shape": model.input_shape,
            "output_shape": model.output_shape,
            "summary": str(model.summary())
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get model info: {str(e)}"
        )