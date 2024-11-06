import React from 'react';
import { AlertCircle } from 'lucide-react';

const Alert = ({ message }) => (
  <div className="flex items-center space-x-2 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
    <AlertCircle className="h-5 w-5" />
    <span>{message}</span>
  </div>
);

export default Alert;