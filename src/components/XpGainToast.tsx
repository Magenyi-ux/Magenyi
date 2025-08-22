
import React, { useState, useEffect } from 'react';

interface XpGainToastProps {
  show: boolean;
  xp: number;
  onClose: () => void;
}

const XpGainToast: React.FC<XpGainToastProps> = ({ show, xp, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000); // Toast disappears after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <div
      className={`fixed bottom-24 right-6 bg-green-500 text-white font-bold py-3 px-5 rounded-lg shadow-xl transition-all duration-300 transform
        ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`}
    >
      +{xp} XP ✨
    </div>
  );
};

export default XpGainToast;