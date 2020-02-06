import React, { useState, MouseEvent } from 'react';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MoreVertIcon from '@material-ui/icons/MoreVert';

const ITEM_HEIGHT = 48;

export default function ServerStateMenu({
  actions,
}: {
  actions: Array<{ label: string; onClick: () => void }>;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  function handleActionClick(action: () => void) {
    return () => {
      handleClose();
      action();
    };
  }

  return (
    <div>
      <IconButton
        aria-controls="server-state-menu"
        aria-haspopup="true"
        aria-label="more"
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        keepMounted
        anchorEl={anchorEl}
        id="server-state-menu"
        open={open}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: 200,
          },
        }}
        onClose={handleClose}
      >
        {actions.map(({ label, onClick }) => (
          <MenuItem key={label} onClick={handleActionClick(onClick)}>
            {label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}
