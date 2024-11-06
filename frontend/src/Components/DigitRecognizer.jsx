import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, RefreshCw, Edit3, Eraser, AlertCircle } from 'lucide-react';
import Alert from './Alert';


const DrawingCanvas = ({ onDrawingComplete }) => {
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Set to 28x28 multiplied by a scale factor for better drawing experience
    const scale = 10;  // This makes the canvas 280x280 pixels
    canvas.width = 28 * scale;
    canvas.height = 28 * scale;
    
    const context = canvas.getContext('2d');
    context.scale(1, 1);
    context.lineCap = 'round';
    context.strokeStyle = 'black';
    context.lineWidth = scale * 0.4;  // Adjusted for scale
    contextRef.current = context;
    
    // Fill with white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    contextRef.current.strokeStyle = isErasing ? 'white' : 'black';
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const stopDrawing = async () => {
    contextRef.current.closePath();
    setIsDrawing(false);
    
    if (onDrawingComplete) {
      const canvas = canvasRef.current;
      
      // Create a temporary canvas for resizing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 28;
      tempCanvas.height = 28;
      const tempContext = tempCanvas.getContext('2d');
      
      // Use better image smoothing
      tempContext.imageSmoothingEnabled = true;
      tempContext.imageSmoothingQuality = 'high';
      
      // Draw the original canvas content onto the smaller canvas
      tempContext.fillStyle = 'white';
      tempContext.fillRect(0, 0, 28, 28);
      tempContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 28, 28);
      
      // Convert to grayscale
      const imageData = tempContext.getImageData(0, 0, 28, 28);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const avg = 255 - ((data[i] + data[i + 1] + data[i + 2]) / 3);
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
      
      tempContext.putImageData(imageData, 0, 0);
      
      // Send the processed image
      onDrawingComplete(tempCanvas.toDataURL('image/png'));
    }
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (onDrawingComplete) {
      onDrawingComplete(null);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          className="border-2 border-indigo-300 rounded-xl cursor-crosshair bg-white"
          style={{ touchAction: 'none' }}
        />
        <motion.div 
          className="absolute -right-16 top-0 space-y-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsErasing(!isErasing)}
            className={`p-3 rounded-full ${
              isErasing ? 'bg-red-200 text-red-600' : 'bg-gray-200 text-gray-600'
            }`}
          >
            <Eraser className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearCanvas}
            className="p-3 bg-red-100 rounded-full text-red-600"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

const DigitRecognizer = () => {
    const [image, setImage] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('draw');
    const fileInputRef = useRef(null);
    
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            setError('File size too large. Please upload an image under 5MB.');
            return;
          }
          
          // Validate file type
          if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file.');
            return;
          }
    
          await processImage(file);
        }
      };
    


      const processImage = async (file) => {
        setIsLoading(true);
        setError(null);
        setPrediction(null);
        setImage(URL.createObjectURL(file));
      
        const formData = new FormData();
        formData.append('file', file);
      
        try {
          console.log('Sending request to backend...');
          
          // Log the file details
          console.log('File details:', {
            name: file.name,
            type: file.type,
            size: file.size
          });
      
          const response = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            body: formData,
          });
          
          console.log('Response status:', response.status);
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Backend error:', errorData);
            throw new Error(errorData.detail || 'Failed to process image');
          }
          
          const result = await response.json();
          console.log('Prediction result:', result);
          setPrediction(result);
        } catch (error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack
          });
          setError(error.message || 'Failed to process image. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };

      const handleDrawingComplete = async (dataUrl) => {
        if (!dataUrl) {
          setPrediction(null);
          return;
        }
      
        try {
          console.log('Processing drawing...');
          
          // Convert dataUrl to File object
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const file = new File([blob], 'drawing.png', { type: 'image/png' });
          
          console.log('Drawing converted to file:', {
            size: file.size,
            type: file.type
          });
          
          await processImage(file);
        } catch (error) {
          console.error('Error processing drawing:', error);
          setError('Failed to process drawing. Please try again.');
        }
      };
      

      const clearAll = () => {
        setImage(null);
        setPrediction(null);
        setError(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      const ErrorAlert = ({ message }) => <Alert message={message} />;

  const tabVariants = {
    inactive: { opacity: 0.5, scale: 0.95 },
    active: { opacity: 1, scale: 1 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="relative bg-white rounded-2xl shadow-xl p-8 backdrop-blur-lg bg-opacity-90">
          {error && <ErrorAlert message={error} />}
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text"
          >
            MNIST Digit Recognizer
          </motion.h1>

          <div className="flex justify-center mb-8 space-x-4">
            <motion.button
              variants={tabVariants}
              animate={activeTab === 'draw' ? 'active' : 'inactive'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('draw')}
              className={`px-6 py-3 rounded-xl flex items-center space-x-2 ${
                activeTab === 'draw' 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Edit3 className="w-5 h-5" />
              <span>Draw</span>
            </motion.button>
            <motion.button
              variants={tabVariants}
              animate={activeTab === 'upload' ? 'active' : 'inactive'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 rounded-xl flex items-center space-x-2 ${
                activeTab === 'upload' 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Upload className="w-5 h-5" />
              <span>Upload</span>
            </motion.button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {activeTab === 'draw' ? (
                  <motion.div
                    key="draw"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <DrawingCanvas onDrawingComplete={handleDrawingComplete} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="relative">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                        id="file-upload"
                      />
                      <motion.label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Upload className="w-12 h-12 text-indigo-500 mb-2" />
                        <span className="text-sm text-gray-600">
                          Upload a handwritten digit
                        </span>
                      </motion.label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-semibold mb-4 text-indigo-900">
                Prediction Results
              </h2>

              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-8 h-8 text-indigo-500" />
                  </motion.div>
                </div>
              ) : prediction ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center p-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg shadow-inner"
                  >
                    <motion.span
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-8xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text"
                    >
                      {prediction.prediction}
                    </motion.span>
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-700">Confidence</h3>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${prediction.confidence * 100}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        transition={{ delay: 0.2 }}
                      />
                    </div>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm text-gray-600"
                    >
                      {(prediction.confidence * 100).toFixed(2)}%
                    </motion.span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-700">
                      Probability Distribution
                    </h3>
                    <div className="grid grid-cols-10 gap-1 h-32">
                      {prediction.probabilities.map((prob, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${prob * 100}%` }}
                            transition={{ delay: idx * 0.1 }}
                            className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-md"
                          />
                          <span className="text-xs text-gray-600 mt-1">{idx}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-48 text-gray-500"
                >
                  <Edit3 className="w-12 h-12 mb-4 text-gray-400" />
                  <p>Draw or upload an image to see the prediction</p>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-indigo-500"
              >
                <RefreshCw className="w-12 h-12" />
              </motion.div>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 text-gray-600"
        >
          Draw a digit or upload an image to get started
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DigitRecognizer;