//My react native classes imported images like this in some example code but
//it seems pretty unecessary imo

import homeIcon from '../assets/icons/home.png';
import plusIcon from '../assets/icons/plus.png';
import settingsIcon from '../assets/icons/settings.png';
import userIcon from '../assets/icons/user.png';
import homeIconSolid from '../assets/icons/home-solid.png';
import plusIconSolid from '../assets/icons/plus-solid.png';
import settingsIconSolid from '../assets/icons/settings-solid.png';
import userIconSolid from '../assets/icons/user-solid.png';
import chevronIconDownWhite from '../assets/icons/chevron-down-white.png';
import chevronIconDownPurple from '../assets/icons/chevron-down-purple.png';
import chevronIconUpWhite from '../assets/icons/chevron-up-white.png';
import chevronIconUpPurple from '../assets/icons/chevron-up-purple.png';
import chevronIconRightWhite from '../assets/icons/chevron-right-white.png';
import chevronIconRightPurple from '../assets/icons/chevron-right-purple.png';

export const tabIcons = {
  homeIcon: homeIcon,
  plusIcon: plusIcon,
  userIcon: userIcon,
  homeIconSolid: homeIconSolid,
  plusIconSolid: plusIconSolid,
  userIconSolid: userIconSolid,
};

export const dropdownIcons = {
  light: {
    chevronIconDown: chevronIconDownWhite,
    chevronIconUp: chevronIconUpWhite,
  },
  dark: {
    chevronIconDown: chevronIconDownPurple,
    chevronIconUp: chevronIconUpPurple,
  },
};

export const linkIcons = {
  light: {
    chevronRight: chevronIconRightWhite,
  },
  dark: {
    chevronRight: chevronIconRightPurple,
  },
};
