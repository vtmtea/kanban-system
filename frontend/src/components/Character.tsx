import { useEffect, useRef, useState } from 'react';

interface CharacterProps {
  color: string;
  isPeeking: boolean;
  peekDirection: 'left' | 'right';
  delay?: number;
}

export function Character({ color, isPeeking, peekDirection, delay = 0 }: CharacterProps) {
  const leftEyeRef = useRef<SVGCircleElement>(null);
  const rightEyeRef = useRef<SVGCircleElement>(null);
  const [isBlinking, setIsBlinking] = useState(false);

  // Eye tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!leftEyeRef.current || !rightEyeRef.current) return;

      const leftEye = leftEyeRef.current.getBoundingClientRect();
      const rightEye = rightEyeRef.current.getBoundingClientRect();

      const leftCenterX = leftEye.left + leftEye.width / 2;
      const leftCenterY = leftEye.top + leftEye.height / 2;
      const rightCenterX = rightEye.left + rightEye.width / 2;
      const rightCenterY = rightEye.top + rightEye.height / 2;

      const maxMove = 3;

      // Left eye movement
      const leftDx = e.clientX - leftCenterX;
      const leftDy = e.clientY - leftCenterY;
      const leftDist = Math.sqrt(leftDx * leftDx + leftDy * leftDy);
      const leftMoveX = leftDist > 0 ? (leftDx / leftDist) * Math.min(leftDist / 50, maxMove) : 0;
      const leftMoveY = leftDist > 0 ? (leftDy / leftDist) * Math.min(leftDist / 50, maxMove) : 0;

      // Right eye movement
      const rightDx = e.clientX - rightCenterX;
      const rightDy = e.clientY - rightCenterY;
      const rightDist = Math.sqrt(rightDx * rightDx + rightDy * rightDy);
      const rightMoveX = rightDist > 0 ? (rightDx / rightDist) * Math.min(rightDist / 50, maxMove) : 0;
      const rightMoveY = rightDist > 0 ? (rightDy / rightDist) * Math.min(rightDist / 50, maxMove) : 0;

      if (!isPeeking) {
        leftEyeRef.current.setAttribute('cx', String(28 + leftMoveX));
        leftEyeRef.current.setAttribute('cy', String(32 + leftMoveY));
        rightEyeRef.current.setAttribute('cx', String(52 + rightMoveX));
        rightEyeRef.current.setAttribute('cy', String(32 + rightMoveY));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPeeking]);

  // Blinking animation
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        blink();
      }
    }, 2000 + delay + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [delay]);

  // Calculate eye position for peeking
  const peekOffset = isPeeking ? (peekDirection === 'right' ? 6 : -6) : 0;

  return (
    <div
      className="character"
      style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        transition: 'transform 0.3s ease',
        transform: isPeeking ? 'translateY(-5px)' : 'translateY(0)',
      }}
    >
      <svg width="80" height="60" viewBox="0 0 80 50">
        {/* Eyes */}
        <g>
          {/* Left eye white */}
          <ellipse
            cx="28"
            cy="30"
            rx="10"
            ry={isBlinking ? 1 : 12}
            fill="white"
            style={{ transition: 'ry 0.1s ease' }}
          />
          {/* Left pupil */}
          <circle
            ref={leftEyeRef}
            cx={28 + peekOffset}
            cy={isPeeking ? 30 : 32}
            r={isBlinking ? 0 : 5}
            fill="#333"
            style={{ transition: 'r 0.1s ease' }}
          />
          {/* Left eye highlight */}
          {!isBlinking && (
            <circle cx={30 + peekOffset} cy="28" r="2" fill="white" />
          )}
        </g>
        <g>
          {/* Right eye white */}
          <ellipse
            cx="52"
            cy="30"
            rx="10"
            ry={isBlinking ? 1 : 12}
            fill="white"
            style={{ transition: 'ry 0.1s ease' }}
          />
          {/* Right pupil */}
          <circle
            ref={rightEyeRef}
            cx={52 + peekOffset}
            cy={isPeeking ? 30 : 32}
            r={isBlinking ? 0 : 5}
            fill="#333"
            style={{ transition: 'r 0.1s ease' }}
          />
          {/* Right eye highlight */}
          {!isBlinking && (
            <circle cx={54 + peekOffset} cy="28" r="2" fill="white" />
          )}
        </g>
        {/* Mouth */}
        <path
          d={isPeeking ? "M 32 42 Q 40 46 48 42" : "M 32 42 Q 40 48 48 42"}
          stroke="#333"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}