import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Button, Dropdown } from 'antd';
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
  const [visibleButtons, setVisibleButtons] = useState(buttons);
  const [hiddenButtons, setHiddenButtons] = useState([]);
  const toolbarRef = useRef(null);
  const buttonRefs = useRef({});
  const [toolbarWidth, setToolbarWidth] = useState(500); // Default width 500px
  const [buttonWidths, setButtonWidths] = useState({});

  const BUTTON_MARGIN = 8; // Margin between buttons
  const ELLIPSIS_BUTTON_WIDTH = 32; // Width of the ellipsis button


  buttonRefs.current = buttons.reduce((acc, button) => {
    acc[button.id] = React.createRef();
    return acc;
  }, {});

  // Measure button widths after render
  useLayoutEffect(() => {
    const measureButtonWidths = () => {
      const newButtonWidths = {};

      buttons.forEach(button => {
        const buttonRef = buttonRefs.current[button.id];
        if (buttonRef && buttonRef.current) {
          newButtonWidths[button.id] = buttonRef.current.getBoundingClientRect().width;
        }
      });

      setButtonWidths(newButtonWidths);
    };

    measureButtonWidths();
  }, [buttons]);

  // Calculate visible buttons whenever button widths change
  useEffect(() => {
    if (Object.keys(buttonWidths).length === buttons.length) {
      calculateVisibleButtons();
    }
  }, [buttonWidths, toolbarWidth]);

  // Add resize listener
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [buttons]);

  const handleResize = () => {
    // Re-measure button widths on resize
    const newButtonWidths = {};

    buttons.forEach(button => {
      const buttonRef = buttonRefs.current[button.id];
      if (buttonRef && buttonRef.current) {
        newButtonWidths[button.id] = buttonRef.current.getBoundingClientRect().width;
      }
    });

    setButtonWidths(newButtonWidths);
  };

  const calculateVisibleButtons = () => {
    const availableWidth = toolbarWidth - ELLIPSIS_BUTTON_WIDTH;
    let totalWidth = 0;
    let visibleCount = 0;

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const buttonWidth = buttonWidths[button.id] || 0;
      // Add button width plus margin (except for the last button)
      const buttonTotalWidth = buttonWidth + (i < buttons.length - 1 ? BUTTON_MARGIN : 0);

      if (totalWidth + buttonTotalWidth <= availableWidth) {
        totalWidth += buttonTotalWidth;
        visibleCount++;
      } else {
        break;
      }
    }

    setVisibleButtons(buttons.slice(0, visibleCount));
    setHiddenButtons(buttons.slice(visibleCount));
  };

  // Menu items for dropdown
  const menuItems = hiddenButtons.map((button) => ({
    key: button.id,
    label: button.name,
    onClick: button.onClick,
  }));

  // Render all buttons initially to measure them, but hide the ones that should be hidden
  const renderAllButtons = () => {
    return buttons.map((button, index) => (
      <Button
        key={button.id}
        ref={buttonRefs.current[button.id]}
        onClick={button.onClick}
        style={{
          marginRight: index < buttons.length - 1 ? `${BUTTON_MARGIN}px` : 0,
          visibility: 'hidden',
          position: 'absolute',
          zIndex: -1,
        }}
        type={index === 0 ? 'primary' : 'default'}
      >
        {button.name}
      </Button>
    ));
  };

  return (
    <div className="app">
      <div className="toolbar-container" style={{ padding: '20px' }}>
        <h2>Toolbar Demo (Dynamic Button Widths)</h2>
        <div
          ref={toolbarRef}
          className="toolbar"
          style={{
            width: `${toolbarWidth}px`,
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #e8e8e8',
            padding: '8px',
            borderRadius: '4px',
            background: '#f5f5f5'
          }}
        >
          {visibleButtons.map((button, index) => (
            <Button
              key={button.id}
              ref={buttonRefs.current[button.id]}
              onClick={button.onClick}
              style={{
                marginRight: index < visibleButtons.length - 1 ? `${BUTTON_MARGIN}px` : 0,
              }}
              type={index === 0 ? 'primary' : 'default'}
            >
              {button.name}
            </Button>
          ))}

          {hiddenButtons.length > 0 && (
            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                icon={<EllipsisOutlined />}
                style={{ marginLeft: visibleButtons.length > 0 ? `${BUTTON_MARGIN}px` : 0 }}
              />
            </Dropdown>
          )}
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

          <div style={{ marginTop: '20px' }}>
            <h3>Button Widths</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {buttons.map(button => (
                <div key={button.id} style={{ border: '1px solid #ddd', padding: '4px 8px', borderRadius: '4px' }}>
                  {button.name}: {Math.round(buttonWidths[button.id] || 0)}px
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 