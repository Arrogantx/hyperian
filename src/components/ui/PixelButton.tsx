import React, { ButtonHTMLAttributes } from 'react';
import { gsap } from 'gsap';

type ButtonColor = 'cyan' | 'magenta' | 'yellow' | 'green' | 'red';
type ButtonSize = 'sm' | 'md' | 'lg';

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  color?: ButtonColor;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const PixelButton: React.FC<PixelButtonProps> = ({
  children,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const colorMap: Record<ButtonColor, string> = {
    cyan: 'bg-hyper-cyan hover:bg-opacity-90 text-hyper-black border-white',
    magenta: 'bg-hyper-magenta hover:bg-opacity-90 text-white border-white',
    yellow: 'bg-hyper-yellow hover:bg-opacity-90 text-hyper-black border-white',
    green: 'bg-hyper-green hover:bg-opacity-90 text-hyper-black border-white',
    red: 'bg-hyper-red hover:bg-opacity-90 text-white border-white'
  };

  const sizeMap: Record<ButtonSize, string> = {
    sm: 'py-1 px-3 text-xs',
    md: 'py-2 px-4 text-sm',
    lg: 'py-3 px-6 text-sm'
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      y: 2,
      x: 2,
      boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
      duration: 0.1,
      ease: 'power1.out'
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      y: 0,
      x: 0,
      boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
      duration: 0.1,
      ease: 'power1.out'
    });
  };

  return (
    <button
      className={`
        font-pixel border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        transition-all duration-100 ease-in-out cursor-pointer
        active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
        ${colorMap[color]}
        ${sizeMap[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
};

export default PixelButton;