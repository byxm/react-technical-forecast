import React, { useState, useEffect, useRef } from 'react';
import { Button, Popover } from 'antd';
// import Popover from './CustomPopover'
import { EllipsisOutlined } from '@ant-design/icons';

// Mock data for buttons with varying text lengths
const generateButtons = (count) => {
  return Array.from({ length: count }, (_, index) => {
    // Create buttons with varying text lengths
    const nameLength = Math.floor(Math.random() * 8) + 2; // Random length between 2-10
    const name = `操作${''.padEnd(nameLength, index + 1)}`;

    return {
      id: `btn-${index + 1}`,
      name,
      onClick: () => console.log(`Button ${index + 1} clicked`),
    };
  });
};

function App() {
  const [buttons] = useState(generateButtons(10)); // Default 10 buttons
  const [toolbarWidth, setToolbarWidth] = useState(500); // Default width 500px
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false); // 新增状态
  const [isCalculating, setIsCalculating] = useState(false); // Add flag to prevent recursive calculations
  
  const toolbarRef = useRef(null);
  const buttonContainerRef = useRef(null);
  const hiddenButtonsContainerRef = useRef(null);
  const ellipsisButtonRef = useRef(null);
  const mutationObserverRef = useRef(null);
  
  const BUTTON_MARGIN = 8; // Margin between buttons
  const ELLIPSIS_BUTTON_WIDTH = 32; // Width of the ellipsis button

  // Function to calculate and handle button visibility using DOM manipulation
  const calculateButtonVisibility = () => {
    if (!toolbarRef.current || !buttonContainerRef.current || (isPopoverOpen && !hiddenButtonsContainerRef.current)) return;
    
    // Prevent recursive calculations
    if (isCalculating) return;
    
    // Set calculating flag to true
    setIsCalculating(true);
    
    console.log("Calculating button visibility...");
    
    const toolbarWidth = toolbarRef.current.clientWidth;
    const buttonContainer = buttonContainerRef.current;
    const hiddenButtonsContainer = hiddenButtonsContainerRef.current;
    const ellipsisButton = ellipsisButtonRef.current;
    
    // Clear the hidden buttons container
    while (hiddenButtonsContainer?.firstChild) {
      hiddenButtonsContainer.removeChild(hiddenButtonsContainer.firstChild);
    }
    
    // Get all button elements (excluding the ellipsis button)
    const allButtons = Array.from(buttonContainer.children).filter(button => {
      return button !== ellipsisButton?.parentNode && 
             !button.classList.contains('non-button-element'); // Exclude any non-button elements
    });
    
    console.log(`Found ${allButtons.length} buttons in container`);
    
    // Make all buttons visible first
    allButtons.forEach(button => {
      button.style.display = 'inline-block';
    });
    
    // Hide the ellipsis button initially
    if (ellipsisButton) {
      ellipsisButton.style.display = 'none';
    }
    
    // Calculate available width
    const availableWidth = toolbarWidth - 16; // Account for padding
    let currentWidth = 0;
    let hasHiddenButtons = false;
    let visibleCount = 0;
    let hiddenCount = 0;
    
    // Iterate through buttons to determine which ones should be visible
    allButtons.forEach((button, index) => {
      const buttonWidth = button.offsetWidth;
      const marginRight = index < allButtons.length - 1 ? BUTTON_MARGIN : 0;
      
      // Check if adding this button (plus ellipsis if needed) would exceed available width
      if (currentWidth + buttonWidth + marginRight + (hasHiddenButtons ? ELLIPSIS_BUTTON_WIDTH : 0) <= availableWidth) {
        currentWidth += buttonWidth + marginRight;
        visibleCount++;
      } else {
        // This button should be hidden
        if (!hasHiddenButtons) {
          hasHiddenButtons = true;
          // Show the ellipsis button
          if (ellipsisButton) {
            ellipsisButton.style.display = 'inline-block';
          }
        }
        
        // Clone the button and add it to the hidden buttons container
        const clonedButton = button.cloneNode(true);
        clonedButton.style.margin = '4px';
        clonedButton.style.display = 'block';
        clonedButton.style.width = '100%';
        
        // Add the original click handler to the cloned button
        const buttonId = button.getAttribute('data-button-id');
        if (buttonId) {
          const originalButton = buttons.find(b => b.id === buttonId);
          if (originalButton) {
            clonedButton.onclick = originalButton.onClick;
          }
        }
        
        hiddenButtonsContainer?.appendChild?.(clonedButton);
        
        // Hide the original button
        button.style.display = 'none';
        hiddenCount++;
      }
    });
    
    // If we have no hidden buttons, hide the ellipsis button
    if (!hasHiddenButtons && ellipsisButton) {
      ellipsisButton.style.display = 'none';
    }
    
    console.log(`Visibility calculation complete. Visible: ${visibleCount}, Hidden: ${hiddenCount}`);
    
    // At the end of the function, set calculating flag back to false
    setTimeout(() => {
      setIsCalculating(false);
    }, 0);
  };

  // Set up MutationObserver to watch for DOM changes in the button container
  useEffect(() => {
    if (!buttonContainerRef.current) return;
    
    // Create a new MutationObserver
    const observer = new MutationObserver((mutations) => {
      let shouldRecalculate = false;
      
      // Don't trigger recalculation if we're already calculating
      if (isCalculating) return;
      
      mutations.forEach(mutation => {
        // Check if nodes were added or removed
        if (mutation.type === 'childList' && 
            (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
          shouldRecalculate = true;
        }
        
        // Check for attribute changes that might affect layout
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'style' || 
             mutation.attributeName === 'class')) {
          shouldRecalculate = true;
        }
      });
      
      if (shouldRecalculate) {
        console.log("DOM changes detected in button container, recalculating...");
        // Use requestAnimationFrame to ensure DOM is updated before measuring
        requestAnimationFrame(() => {
          calculateButtonVisibility();
        });
      }
    });
    
    // Configure the observer to watch for changes to the node and its descendants
    const observerConfig = {
      childList: true,     // Watch for changes to the direct children
      attributes: true,    // Watch for changes to attributes
      subtree: true,       // Watch for changes to descendants
      characterData: true  // Watch for changes to text content
    };
    
    // Start observing the button container
    observer.observe(buttonContainerRef.current, observerConfig);
    
    // Store the observer in the ref
    mutationObserverRef.current = observer;
    
    // Clean up the observer when the component unmounts
    return () => {
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
    };
  }, [isCalculating]); // Add isCalculating to the dependency array

  // Calculate button visibility after initial render and when toolbar width changes
  useEffect(() => {
    // Use setTimeout to ensure the DOM is fully rendered
    const timer = setTimeout(() => {
      calculateButtonVisibility();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [toolbarWidth]);

  // Handle popover visibility change
  const handlePopoverVisibleChange = (visible) => {
    setPopoverVisible(visible);
    setIsPopoverOpen(visible); // 更新 popover 打开状态
    // if (visible) {
      calculateButtonVisibility(); // 仅在 popover 打开时计算按钮可见性
    // }
  };

  // Custom popover content with hidden buttons
  const popoverContent = (
    <div 
      ref={hiddenButtonsContainerRef}
      className="hidden-buttons-container" 
      style={{ 
        minWidth: '120px',
        maxWidth: '200px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}
    />
  );

  // Simulate external button removal (for testing)
  const removeRandomButton = () => {
    if (!buttonContainerRef.current) return;
    
    const buttons = Array.from(buttonContainerRef.current.children).filter(
      child => child !== ellipsisButtonRef.current?.parentNode
    );
    
    if (buttons.length > 0) {
      const randomIndex = Math.floor(Math.random() * buttons.length);
      const buttonToRemove = buttons[randomIndex];
      
      if (buttonToRemove && buttonToRemove.parentNode) {
        buttonToRemove.parentNode.removeChild(buttonToRemove);
      }
    }
  };

  return (
    <div className="app">
      <div className="toolbar-container" style={{ padding: '20px' }}>
        <h2>Toolbar Demo (DOM-based Approach)</h2>
        
        <div 
          ref={toolbarRef} 
          className="toolbar" 
          style={{ 
            width: `${toolbarWidth}px`, 
            border: '1px solid #e8e8e8',
            padding: '8px',
            borderRadius: '4px',
            background: '#f5f5f5',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <div 
            ref={buttonContainerRef}
            className="button-container" 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              width: '100%'
            }}
          >
            {buttons.map((button, index) => (
              <Button
                key={button.id}
                data-button-id={button.id}
                onClick={button.onClick}
                style={{
                  marginRight: index < buttons.length - 1 ? `${BUTTON_MARGIN}px` : 0,
                }}
                type={index === 0 ? 'primary' : 'default'}
              >
                {button.name}
              </Button>
            ))}
            
            <Popover
              content={popoverContent}
              trigger="click"
              placement="bottomRight"
              open={popoverVisible}
              onOpenChange={handlePopoverVisibleChange}
            >
              <Button 
                ref={ellipsisButtonRef}
                icon={<EllipsisOutlined />} 
                style={{ 
                  marginLeft: `${BUTTON_MARGIN}px`,
                  display: 'none' // Initially hidden
                }}
              />
            </Popover>
          </div>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h3>Toolbar Width Control</h3>
          <div>
            <Button 
              onClick={() => setToolbarWidth(Math.max(100, toolbarWidth - 50))}
              style={{ marginRight: '8px' }}
            >
              Decrease Width
            </Button>
            <Button 
              onClick={() => setToolbarWidth(toolbarWidth + 50)}
            >
              Increase Width
            </Button>
            <div style={{ marginTop: '8px' }}>
              Current width: {toolbarWidth}px
            </div>
          </div>
          
          {/* Test button for simulating external DOM changes */}
          <div style={{ marginTop: '20px' }}>
            <h3>Test External DOM Changes</h3>
            <Button 
              onClick={removeRandomButton}
              danger
            >
              Remove Random Button
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 