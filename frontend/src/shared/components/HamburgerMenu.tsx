import { ActionIcon } from '@mantine/core';
import { IoMdMenu } from "react-icons/io";

interface HamburgerMenuProps {
  onClick?: () => void
}
export function HamburgerMenu({ onClick }: HamburgerMenuProps) {
  return (
    <ActionIcon variant="transparent" color="white" onClick={onClick} size="xl" aria-label="Menu">
      <IoMdMenu size={40} />
    </ActionIcon>
  );
}
