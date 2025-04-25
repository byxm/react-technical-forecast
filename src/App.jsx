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

// Generate a fixed set of buttons with predictable lengths for testing
const SAMPLE_BUTTONS = [
  { id: 'btn-1', name: '操作111111', onClick: () => console.log('Button 1 clicked') },
  { id: 'btn-2', name: '操作22', onClick: () => console.log('Button 2 clicked') },
  { id: 'btn-3', name: '操作33', onClick: () => console.log('Button 3 clicked') },
  { id: 'btn-4', name: '操作44', onClick: () => console.log('Button 4 clicked') },
  { id: 'btn-5', name: '操作5555555', onClick: () => console.log('Button 5 clicked') },
  { id: 'btn-6', name: '操作666666666', onClick: () => console.log('Button 6 clicked') },
  { id: 'btn-7', name: '操作7777777', onClick: () => console.log('Button 7 clicked') },
  { id: 'btn-8', name: '操作8888', onClick: () => console.log('Button 8 clicked') },
  { id: 'btn-9', name: '操作9999', onClick: () => console.log('Button 9 clicked') },
  { id: 'btn-10', name: '操作10', onClick: () => console.log('Button 10 clicked') },
  { id: 'btn-11', name: '操作11', onClick: () => console.log('Button 11 clicked') },
  { id: 'btn-12', name: '操作12', onClick: () => console.log('Button 12 clicked') },
];

function App() {
  const [buttons] = useState(SAMPLE_BUTTONS);
  const [toolbarWidth, setToolbarWidth] = useState(500); // Default width 500px
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [maxRows, setMaxRows] = useState(2); // Default max rows before overflow
  const [hiddenButtonIndices, setHiddenButtonIndices] = useState([]); // Store indices of hidden buttons
  
  const toolbarRef = useRef(null);
  const buttonContainerRef = useRef(null);
  const hiddenButtonsContainerRef = useRef(null);
  const ellipsisButtonRef = useRef(null);
  const mutationObserverRef = useRef(null);
  
  const BUTTON_MARGIN = 8; // Margin between buttons
  const ELLIPSIS_BUTTON_WIDTH = 50; // Width of the ellipsis button with margin (increased for safety)
  const ROW_GAP = 8; // Gap between rows
  const ROW_HEIGHT = 32 + ROW_GAP; // Height of each row (button height + gap)

  // Function to calculate and handle button visibility using DOM manipulation
  const calculateButtonVisibility = () => {
    if (!toolbarRef.current || !buttonContainerRef.current) return;
    
    // Prevent recursive calculations
    if (isCalculating) return;
    
    // Set calculating flag to true
    setIsCalculating(true);
    
    console.log("Calculating button visibility...");
    
    const toolbarWidth = toolbarRef.current.clientWidth;
    const buttonContainer = buttonContainerRef.current;
    const ellipsisButton = ellipsisButtonRef.current;
    
    // Get all button elements (excluding the ellipsis button container)
    const allButtons = Array.from(buttonContainer.children).filter(button => {
      return !button.classList.contains('ellipsis-button-container') && 
             !button.classList.contains('non-button-element');
    });
    
    console.log(`Found ${allButtons.length} buttons in container`);
    
    // Make all buttons visible first for measurement
    allButtons.forEach(button => {
      button.style.display = 'inline-block';
    });
    
    // Hide the ellipsis button initially
    if (ellipsisButton) {
      ellipsisButton.style.display = 'none';
      if (ellipsisButton.parentNode) {
        ellipsisButton.parentNode.style.display = 'none';
        ellipsisButton.parentNode.classList.add('ellipsis-button-container');
      }
    }
    
    // Calculate available width (accounting for padding)
    const availableWidth = toolbarWidth - 16; 
    
    // First pass: Just calculate button positions as if we're displaying all buttons
    // Create a temporary container to measure layout without affecting the DOM
    const tempContainer = document.createElement('div');
    tempContainer.style.width = availableWidth + 'px';
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.display = 'flex';
    tempContainer.style.flexWrap = 'wrap';
    tempContainer.style.gap = ROW_GAP + 'px';
    
    // Clone buttons to temp container for measurement
    const buttonElements = [];
    allButtons.forEach((button, index) => {
      const clone = button.cloneNode(true);
      clone.style.marginRight = BUTTON_MARGIN + 'px';
      clone.style.marginBottom = ROW_GAP + 'px';
      clone.dataset.index = index;
      tempContainer.appendChild(clone);
      buttonElements.push({
        element: clone,
        index: index,
        width: button.offsetWidth,
        height: button.offsetHeight
      });
    });
    
    document.body.appendChild(tempContainer);
    
    // Determine button positions after layout
    const buttonPositions = [];
    buttonElements.forEach(btn => {
      const rect = btn.element.getBoundingClientRect();
      buttonPositions.push({
        index: btn.index,
        left: rect.left,
        top: rect.top,
        width: btn.width,
        row: Math.floor(rect.top / ROW_HEIGHT)
      });
    });
    
    // Remove temp container
    document.body.removeChild(tempContainer);
    
    // Determine rows based on positions
    const rows = [];
    let currentRow = [];
    let currentRowIndex = 0;
    
    // Group buttons into rows
    buttonPositions.sort((a, b) => a.top - b.top || a.left - b.left); // Sort by top then left
    
    buttonPositions.forEach((btn, idx) => {
      const btnRowIndex = Math.floor((btn.top - buttonPositions[0].top) / ROW_HEIGHT);
      
      if (btnRowIndex > currentRowIndex) {
        // We've moved to a new row
        if (currentRow.length > 0) {
          rows.push([...currentRow]);
          currentRow = [];
        }
        currentRowIndex = btnRowIndex;
      }
      
      currentRow.push(btn.index);
    });
    
    // Add the last row
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }
    
    console.log(`Rows detected: ${rows.length}`);
    
    // Determine visible and hidden buttons
    let visibleButtons = [];
    let hiddenButtons = [];
    
    // If we have fewer or equal rows to maxRows, show all buttons
    if (rows.length <= maxRows) {
      rows.forEach(row => {
        visibleButtons.push(...row);
      });
    } else {
      // Show complete rows up to maxRows-1
      for (let i = 0; i < maxRows - 1; i++) {
        if (i < rows.length) {
          visibleButtons.push(...rows[i]);
        }
      }
      
      // For the last row, we need to ensure the ellipsis fits
      if (maxRows - 1 < rows.length) {
        const lastRowIndex = maxRows - 1;
        const lastRow = rows[lastRowIndex];
        
        // Measure how many buttons can fit with the ellipsis button
        const lastRowButtons = lastRow.map(index => allButtons[index]);
        
        let currentWidth = 0;
        let buttonsToShow = 0;
        
        // Leave space for ellipsis button
        const ellipsisReservedWidth = ELLIPSIS_BUTTON_WIDTH + BUTTON_MARGIN;
        const availableWidthForLastRow = availableWidth - ellipsisReservedWidth;
        
        // Calculate how many buttons can fit
        for (let i = 0; i < lastRowButtons.length; i++) {
          const button = lastRowButtons[i];
          const buttonWidth = button.offsetWidth + BUTTON_MARGIN;
          
          if (currentWidth + buttonWidth <= availableWidthForLastRow) {
            currentWidth += buttonWidth;
            buttonsToShow++;
          } else {
            break;
          }
        }
        
        // Add buttons from the last row that fit
        for (let i = 0; i < buttonsToShow; i++) {
          visibleButtons.push(lastRow[i]);
        }
        
        // Add remaining buttons from last row to hidden buttons
        for (let i = buttonsToShow; i < lastRow.length; i++) {
          hiddenButtons.push(lastRow[i]);
        }
      }
      
      // Add all buttons from rows beyond maxRows to hidden buttons
      for (let i = maxRows; i < rows.length; i++) {
        hiddenButtons.push(...rows[i]);
      }
    }
    
    console.log(`Visible buttons: ${visibleButtons.length}, Hidden: ${hiddenButtons.length}`);
    
    // Store the hidden button indices for later use
    setHiddenButtonIndices(hiddenButtons);
    
    // Apply visibility to buttons
    allButtons.forEach((button, index) => {
      if (visibleButtons.includes(index)) {
        button.style.display = 'inline-block';
      } else {
        button.style.display = 'none';
      }
    });
    
    // Show/hide ellipsis button
    if (ellipsisButton && ellipsisButton.parentNode) {
      if (hiddenButtons.length > 0) {
        // Show the ellipsis button container
        ellipsisButton.parentNode.style.display = 'inline-block';
        ellipsisButton.style.display = 'inline-block';
        
        // Position ellipsis button at the end of visible buttons
        if (visibleButtons.length > 0) {
          const lastVisibleButtonIndex = visibleButtons[visibleButtons.length - 1];
          const lastVisibleButton = allButtons[lastVisibleButtonIndex];
          
          if (lastVisibleButton && lastVisibleButton.parentNode) {
            // Insert after last visible button
            buttonContainer.insertBefore(
              ellipsisButton.parentNode,
              lastVisibleButton.nextSibling
            );
          }
        }
      } else {
        // Hide ellipsis button if no hidden buttons
        ellipsisButton.parentNode.style.display = 'none';
        ellipsisButton.style.display = 'none';
      }
    }
    
    // If popover is open, update hidden buttons
    if (popoverVisible && hiddenButtonsContainerRef.current) {
      updatePopoverContent(hiddenButtons, allButtons);
    }
    
    console.log("Visibility calculation complete.");
    
    // Set calculating flag back to false
    setTimeout(() => {
      setIsCalculating(false);
    }, 0);
  };

  // Function to update popover content without recalculating button visibility
  const updatePopoverContent = (hiddenIndices, allButtons) => {
    const hiddenButtonsContainer = hiddenButtonsContainerRef.current;
    if (!hiddenButtonsContainer) return;
    
    // Clear the hidden buttons container
    while (hiddenButtonsContainer.firstChild) {
      hiddenButtonsContainer.removeChild(hiddenButtonsContainer.firstChild);
    }
    
    // Create and add clones of hidden buttons to the container
    hiddenIndices.forEach(index => {
      const button = allButtons[index];
      if (!button) return;
      
      const clonedButton = button.cloneNode(true);
      clonedButton.style.margin = '4px';
      clonedButton.style.display = 'block';
      clonedButton.style.width = '100%';
      
      // Add the original click handler
      const buttonId = button.getAttribute('data-button-id');
      if (buttonId) {
        const originalButton = buttons.find(b => b.id === buttonId);
        if (originalButton) {
          clonedButton.onclick = originalButton.onClick;
        }
      }
      
      hiddenButtonsContainer.appendChild(clonedButton);
    });
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
  }, [isCalculating]); 

  // Calculate button visibility after initial render and when toolbar width changes
  useEffect(() => {
    // Use setTimeout to ensure the DOM is fully rendered
    const timer = setTimeout(() => {
      calculateButtonVisibility();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [toolbarWidth, maxRows]);

  // Handle popover visibility change
  const handlePopoverVisibleChange = (visible) => {
    setPopoverVisible(visible);
    
    // When popover opens, update content without recalculating button visibility
    if (visible && !isCalculating && hiddenButtonsContainerRef.current) {
      const allButtons = Array.from(buttonContainerRef.current.children).filter(button => {
        return !button.classList.contains('ellipsis-button-container') && 
               !button.classList.contains('non-button-element');
      });
      
      // Use stored hidden button indices to update popover content
      updatePopoverContent(hiddenButtonIndices, allButtons);
    }
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
      child => !child.classList.contains('ellipsis-button-container')
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
        <h2>Multi-<span style={{ color: '#ff7875' }}>row</span> Toolbar Demo</h2>
        
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
              flexWrap: 'wrap',
              alignItems: 'center',
              width: '100%',
              gap: `${ROW_GAP}px`,
              position: 'relative'
            }}
          >
            {buttons.map((button, index) => (
              <Button
                key={button.id}
                data-button-id={button.id}
                onClick={button.onClick}
                style={{
                  marginRight: `${BUTTON_MARGIN}px`,
                  marginBottom: `${ROW_GAP}px`
                }}
                type={index === 0 ? 'primary' : 'default'}
              >
                {button.name}
              </Button>
            ))}
            
            <div className="ellipsis-button-container">
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
                    display: 'none' // Initially hidden
                  }}
                >
                  ...
                </Button>
              </Popover>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h3>Toolbar <span style={{ color: '#ff7875' }}>Width</span> Control</h3>
          <div>
            <Button 
              onClick={() => setToolbarWidth(Math.max(100, toolbarWidth - 50))}
              style={{ marginRight: '8px' }}
            >
              Decrease Width
            </Button>
            <Button 
              onClick={() => setToolbarWidth(toolbarWidth + 50)}
              style={{ marginRight: '8px' }}
            >
              Increase Width
            </Button>
            <div style={{ marginTop: '8px' }}>
              Current <span style={{ color: '#ff7875' }}>width</span>: {toolbarWidth}px
            </div>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <h3>Max Rows <span style={{ color: '#ff7875' }}>Control</span></h3>
            <div>
              <Button 
                onClick={() => setMaxRows(Math.max(1, maxRows - 1))}
                style={{ marginRight: '8px' }}
              >
                Decrease Max Rows
              </Button>
              <Button 
                onClick={() => setMaxRows(maxRows + 1)}
                style={{ marginRight: '8px' }}
              >
                Increase Max Rows
              </Button>
              <div style={{ marginTop: '8px' }}>
                Max <span style={{ color: '#ff7875' }}>rows</span> before <span style={{ color: '#ff7875' }}>overflow</span>: {maxRows}
              </div>
            </div>
          </div>
          
          {/* Test button for simulating external DOM changes */}
          <div style={{ marginTop: '20px' }}>
            <h3>Test <span style={{ color: '#ff7875' }}>External</span> DOM Changes</h3>
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