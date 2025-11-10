import React from 'react';
import type { ButtonProps } from '../ui/button';
import type { LogoProps } from '../ui/logo';

export interface ButtonItem extends ButtonProps {
  onClick: () => void;                                                     // Button click handler
}
export interface LogoConfig extends LogoProps {
  href?: string;                     // Logo link destination - OPTIONAL
}