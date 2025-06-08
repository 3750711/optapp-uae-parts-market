
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";

interface SimpleCaptchaProps {
  onVerify: (verified: boolean) => void;
  isVisible: boolean;
}

const SimpleCaptcha: React.FC<SimpleCaptchaProps> = ({ onVerify, isVisible }) => {
  const [captchaQuestion, setCaptchaQuestion] = useState({ question: '', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let answer: number;
    let question: string;
    
    if (operation === '+') {
      answer = num1 + num2;
      question = `${num1} + ${num2}`;
    } else {
      answer = Math.max(num1, num2) - Math.min(num1, num2);
      question = `${Math.max(num1, num2)} - ${Math.min(num1, num2)}`;
    }
    
    setCaptchaQuestion({ question, answer });
    setUserAnswer('');
    setIsVerified(false);
    onVerify(false);
  };

  useEffect(() => {
    if (isVisible) {
      generateCaptcha();
    }
  }, [isVisible]);

  const handleVerify = () => {
    const isCorrect = parseInt(userAnswer) === captchaQuestion.answer;
    setIsVerified(isCorrect);
    onVerify(isCorrect);
    
    if (!isCorrect) {
      generateCaptcha();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Подтвердите, что вы не робот:</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={generateCaptcha}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-lg font-mono bg-white px-3 py-2 border rounded">
          {captchaQuestion.question} = ?
        </span>
        <Input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Ответ"
          className="w-20"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleVerify();
            }
          }}
        />
        <Button
          type="button"
          onClick={handleVerify}
          disabled={!userAnswer}
          size="sm"
        >
          Проверить
        </Button>
      </div>
      
      {isVerified && (
        <div className="text-green-600 text-sm">
          ✓ Проверка пройдена
        </div>
      )}
    </div>
  );
};

export default SimpleCaptcha;
