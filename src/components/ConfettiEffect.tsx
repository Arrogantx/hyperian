import React, { useCallback, useRef, useLayoutEffect } from 'react';
import ReactCanvasConfetti from 'react-canvas-confetti';

const canvasStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  zIndex: 999
} as const;

const ConfettiEffect: React.FC = () => {
  const refAnimationInstance = useRef<any>(null);

  const getInstance = useCallback((instance: any) => {
    refAnimationInstance.current = instance;
  }, []);

  const makeShot = useCallback((particleRatio: number, opts: any) => {
    if (refAnimationInstance.current) {
      refAnimationInstance.current({
        ...opts,
        origin: { y: 0.7 },
        particleCount: Math.floor(200 * particleRatio)
      });
    }
  }, []);

  const fire = useCallback(() => {
    const effects = [
      {
        spread: 26,
        startVelocity: 55,
        decay: 0.91,
        scalar: 0.8,
        ticks: 100,
        particleRatio: 0.25,
        colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF66', '#0066FF']
      },
      {
        spread: 60,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
        ticks: 70,
        particleRatio: 0.2,
        colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF66', '#0066FF']
      },
      {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        startVelocity: 45,
        ticks: 120,
        particleRatio: 0.35,
        colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF66', '#0066FF']
      },
      {
        spread: 120,
        startVelocity: 30,
        decay: 0.92,
        scalar: 1.2,
        ticks: 90,
        particleRatio: 0.1,
        colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF66', '#0066FF']
      }
    ];

    effects.forEach(effect => {
      makeShot(effect.particleRatio, effect);
    });
  }, [makeShot]);

  useLayoutEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fire();
      const interval = window.setInterval(fire, 1500);
      return () => {
        window.clearInterval(interval);
        window.clearTimeout(timeoutId);
      };
    }, 100);
    
    return () => window.clearTimeout(timeoutId);
  }, [fire]);

  return (
    <ReactCanvasConfetti
      refConfetti={getInstance}
      style={canvasStyles}
    />
  );
};

export default ConfettiEffect;