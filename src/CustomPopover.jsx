import React, { useState, useEffect, useRef } from 'react';

const CustomPopover = ({ 
  children, 
  content, 
  placement = 'bottomRight', 
  trigger = 'click',
  open,
  onOpenChange
}) => {
  const [visible, setVisible] = useState(open || false);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);
  
  // Sync with external open state if provided
  useEffect(() => {
    if (open !== undefined) {
      setVisible(open);
    }
  }, [open]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        visible &&
        contentRef.current && 
        triggerRef.current &&
        !contentRef.current.contains(event.target) &&
        !triggerRef.current.contains(event.target)
      ) {
        setVisible(false);
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onOpenChange]);

  // Handle trigger click
  const handleTriggerClick = () => {
    const newVisible = !visible;
    setVisible(newVisible);
    if (onOpenChange) {
      onOpenChange(newVisible);
    }
  };

  // Calculate position
  const getContentStyle = () => {
    if (!triggerRef.current) return {};
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    
    let top, left;
    
    switch (placement) {
      case 'bottom':
        top = triggerRect.bottom + 4;
        left = triggerRect.left + triggerRect.width / 2;
        break;
      case 'bottomLeft':
        top = triggerRect.bottom + 4;
        left = triggerRect.left;
        break;
      case 'bottomRight':
      default:
        top = triggerRect.bottom + 4;
        left = triggerRect.right;
        break;
    }
    
    return {
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      transform: placement === 'bottom' ? 'translateX(-50%)' : 
                 placement === 'bottomRight' ? 'translateX(-100%)' : 'none',
    };
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div 
        ref={triggerRef}
        onClick={trigger === 'click' ? handleTriggerClick : undefined}
      >
        {children}
      </div>
      
      <div 
        ref={contentRef}
        style={{
          ...getContentStyle(),
          display: visible ? 'block' : 'none',
          backgroundColor: 'white',
          boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
          borderRadius: '2px',
          padding: '12px',
          zIndex: 1050,
        }}
      >
        {content}
      </div>
    </div>
  );
};

export default CustomPopover; 