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
      className="category-back-button fixed left-3 top-4 z-[100] flex min-h-9 items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[#8996A3] transition-colors hover:text-[#4D8DFF] sm:left-8 sm:top-6 sm:gap-2 sm:text-sm sm:tracking-widest group"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      {label}
    </button>
  );
}

