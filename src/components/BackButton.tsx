import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  onClick?: () => void;
  label?: string;
}

export function BackButton({ onClick, label = 'BACK' }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <button 
      onClick={handleBack}
      className="category-back-button fixed top-6 left-4 sm:left-8 z-[100] flex items-center gap-2 text-sm text-[#8996A3] hover:text-[#4D8DFF] transition-colors uppercase tracking-widest group"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      {label}
    </button>
  );
}
