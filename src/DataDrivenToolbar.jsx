import React, { useState, useEffect, useRef } from 'react';
import { Button, Popover } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

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

// Constants
const BUTTON_MARGIN = 8; // Margin between buttons
const ELLIPSIS_BUTTON_WIDTH = 90; // Increase width to be conservative
const ROW_GAP = 8; // Gap between rows

function DataDrivenToolbar() {
  // State
  const [allButtons] = useState(SAMPLE_BUTTONS);
  const [toolbarWidth, setToolbarWidth] = useState(500); // Default width
  const [maxRows, setMaxRows] = useState(2); // Default max rows before overflow
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);
  
  // State for visible and hidden buttons (data-driven approach)
  const [buttonState, setButtonState] = useState({
    visibleButtons: [],
    hiddenButtons: []
  });
  
  // Refs
  const toolbarRef = useRef(null);
  const buttonRefs = useRef([]);
  
  // Initialize button refs
  useEffect(() => {
    buttonRefs.current = allButtons.map(() => React.createRef());
    const timer = setTimeout(() => {
      setInitialRenderComplete(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [allButtons]);

  // Function to estimate button width based on text content
  const estimateButtonWidth = (text) => {
    // Conservative estimation - assume wider buttons
    return Math.max(80, 40 + text.length * 10) + BUTTON_MARGIN;
  };

  // Function to measure actual button width from refs
  const getMeasuredWidth = (button, index) => {
    if (buttonRefs.current[index] && buttonRefs.current[index].current) {
      return buttonRefs.current[index].current.offsetWidth + BUTTON_MARGIN;
    }
    return estimateButtonWidth(button.name);
  };

  // Create a debug log for the current calculation
  const logButtonLayout = (rows, hiddenCount) => {
    console.log('--------------------------------');
    console.log(`Toolbar width: ${toolbarWidth}px, Max rows: ${maxRows}`);
    rows.forEach((row, i) => {
      console.log(`Row ${i + 1}: ${row.width}px, ${row.buttons.length} buttons`);
      const buttonNames = row.buttons.map(b => b.name).join(', ');
      console.log(`   Buttons: ${buttonNames}`);
    });
    console.log(`Hidden buttons: ${hiddenCount}`);
    console.log('--------------------------------');
  };

  // Determine which buttons should be visible and which hidden
  const calculateButtonVisibility = () => {
    if (!toolbarRef.current || !initialRenderComplete) return;
    
    // Get the available width, subtracting padding and a safety margin
    const availableWidth = toolbarRef.current.clientWidth - 24; // More conservative margin
    
    // If no width available, exit early
    if (availableWidth <= 0) return;
    
    // Create a layout plan
    const visibleButtons = [];
    const hiddenButtons = [];
    
    // Create rows based on width
    const rows = [];
    for (let i = 0; i < maxRows; i++) {
      rows.push({ buttons: [], width: 0 });
    }
    
    // Special case: If only one row is allowed, reserve space for ellipsis
    if (maxRows === 1) {
      rows[0].reservedWidth = ELLIPSIS_BUTTON_WIDTH;
    }
    
    // First pass: fill rows but ensure the last row has space for ellipsis
    let currentRowIndex = 0;
    
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const buttonWidth = getMeasuredWidth(button, i);
      
      // If we're on the last row, always leave space for ellipsis button
      // Be more conservative with the space
      const effectiveAvailableWidth = currentRowIndex === maxRows - 1 
        ? availableWidth - ELLIPSIS_BUTTON_WIDTH 
        : availableWidth;
      
      // If button fits in current row
      if (rows[currentRowIndex].width + buttonWidth <= effectiveAvailableWidth) {
        rows[currentRowIndex].buttons.push(button);
        rows[currentRowIndex].width += buttonWidth;
      } 
      // If we can move to next row
      else if (currentRowIndex < maxRows - 1) {
        currentRowIndex++;
        
        // If this is now the last row, check if this button plus ellipsis would fit
        if (currentRowIndex === maxRows - 1) {
          // If this button plus ellipsis won't fit in a new row either, hide it
          if (buttonWidth + ELLIPSIS_BUTTON_WIDTH > availableWidth) {
            hiddenButtons.push(button);
            // Hide all remaining buttons
            for (let j = i + 1; j < allButtons.length; j++) {
              hiddenButtons.push(allButtons[j]);
            }
            break;
          }
        }
        
        rows[currentRowIndex].buttons.push(button);
        rows[currentRowIndex].width = buttonWidth;
      } 
      // Otherwise button must be hidden
      else {
        // All remaining buttons go to hidden
        hiddenButtons.push(button);
        for (let j = i + 1; j < allButtons.length; j++) {
          hiddenButtons.push(allButtons[j]);
        }
        break;
      }
    }
    
    // Second pass: check if the last row has enough space for the ellipsis button
    if (rows.length > 0 && currentRowIndex === maxRows - 1) {
      const lastRow = rows[currentRowIndex];
      
      // Check if adding ellipsis to the last row would exceed the available width
      // If it would, we need to remove buttons until it fits
      while (lastRow.buttons.length > 0 && 
             lastRow.width + ELLIPSIS_BUTTON_WIDTH > availableWidth) {
        const removedButton = lastRow.buttons.pop();
        // Adjust the row width
        const removedWidth = getMeasuredWidth(removedButton, allButtons.indexOf(removedButton));
        lastRow.width -= removedWidth;
        
        // Add to hidden buttons
        hiddenButtons.unshift(removedButton); // Add to front to maintain order
      }
    }
    
    // Assemble visible buttons
    for (let i = 0; i < rows.length; i++) {
      visibleButtons.push(...rows[i].buttons);
    }
    
    // Always ensure there's at least one hidden button to show ellipsis
    // This is important for UX consistency
    if (hiddenButtons.length === 0 && visibleButtons.length > 1) {
      // Move the last visible button to hidden
      const lastButton = visibleButtons.pop();
      hiddenButtons.push(lastButton);
    }
    
    // Debug logging
    logButtonLayout(rows, hiddenButtons.length);
    
    // Update state
    setButtonState({
      visibleButtons,
      hiddenButtons
    });
  };
  
  // Handle popover visibility change
  const handlePopoverVisibleChange = (visible) => {
    setPopoverVisible(visible);
  };
  
  // Calculate button visibility after initial render or when dependencies change
  useEffect(() => {
    if (!initialRenderComplete) return;
    
    calculateButtonVisibility();
  }, [toolbarWidth, maxRows, initialRenderComplete]);
  
  // Handle window resize
  useEffect(() => {
    if (!initialRenderComplete) return;
    
    const handleResize = () => calculateButtonVisibility();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [initialRenderComplete]);
  
  // Force calculation after timeout - use multiple calculations to ensure accuracy
  useEffect(() => {
    // Initial calculation with short delay
    const initialTimer = setTimeout(() => {
      calculateButtonVisibility();
    }, 100);
    
    // Secondary calculation with longer delay
    const secondaryTimer = setTimeout(() => {
      calculateButtonVisibility();
    }, 300);
    
    // Final calculation with even longer delay to ensure everything's rendered and measured
    const finalTimer = setTimeout(() => {
      calculateButtonVisibility();
    }, 600);
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(secondaryTimer);
      clearTimeout(finalTimer);
    };
  }, []);
  
  // Create popover content with hidden buttons
  const popoverContent = (
    <div 
      className="hidden-buttons-container" 
      style={{ 
        minWidth: '120px',
        maxWidth: '200px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}
    >
      {buttonState.hiddenButtons.map((button) => (
        <Button
          key={`hidden-${button.id}`}
          onClick={button.onClick}
          style={{
            margin: '4px',
            width: '100%',
            display: 'block'
          }}
        >
          {button.name}
        </Button>
      ))}
    </div>
  );
  
  return (
    <div className="app">
      <div className="toolbar-container" style={{ padding: '20px' }}>
        <h2>Data-Driven <span style={{ color: '#ff7875' }}>Multi-row</span> Toolbar</h2>
        
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
            className="button-container" 
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              width: '100%',
              gap: `${ROW_GAP}px`,
              position: 'relative',
              maxHeight: `${maxRows * 40}px` // Limit height to enforce max rows
            }}
          >
            {/* Render visible buttons */}
            {buttonState.visibleButtons.map((button, index) => (
              <Button
                ref={buttonRefs.current[allButtons.indexOf(button)]}
                key={button.id}
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
            
            {/* Render ellipsis button if there are hidden buttons */}
            {buttonState.hiddenButtons.length > 0 && (
              <Popover
                content={popoverContent}
                trigger="click"
                placement="bottomRight"
                open={popoverVisible}
                onOpenChange={handlePopoverVisibleChange}
              >
                <Button 
                  icon={<EllipsisOutlined />} 
                  style={{ 
                    marginRight: `${BUTTON_MARGIN}px`,
                    marginBottom: `${ROW_GAP}px`
                  }}
                >
                  ...
                </Button>
              </Popover>
            )}
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
        </div>
      </div>
    </div>
  );
}

export default DataDrivenToolbar; 