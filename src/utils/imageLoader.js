// Import all IIT logos
import PalakkadLogo from '../assets/IITLOGOS/Palakkad.jpg';

// Import all IIT hero images
import IITPkd from '../assets/IITs/IITPkd.jpg';

// Logo image mapping
export const logoImages = {
  'Palakkad.jpg': PalakkadLogo,
};

// Hero image mapping
export const heroImages = {
  'IITPkd.jpg': IITPkd,
};

// Helper function to get image
export const getImageUrl = (filename, type = 'logo') => {
  const images = type === 'logo' ? logoImages : heroImages;
  return images[filename] || '';
};
