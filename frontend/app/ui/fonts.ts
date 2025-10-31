import { Inter, Outfit, Shadows_Into_Light_Two  } from 'next/font/google';

export const shadowsIntoLightTwo = Shadows_Into_Light_Two({
      subsets: ['latin'], // Specify the necessary subsets
      weight: ['400'], // Specify the desired weights (Shadows Into Light Two typically only has 400)
      variable: '--font-shadows', // Optional: define a CSS variable for easier use with Tailwind CSS
      display: 'swap',
    });
 
export const inter = Inter({ 
    subsets: ['latin'],
    weight: ['400', '500','600','700', '800'],
    variable: '--font-inter',
    display: 'swap',
});
export const outfit = Outfit({
    subsets: ['latin'],
    weight: ['100','200','300','400','500','600','700','800'],
    variable: '--font-outfit',
    display: 'swap',
}); 
