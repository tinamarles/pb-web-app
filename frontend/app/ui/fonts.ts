import { Inter } from 'next/font/google';
import { Outfit } from 'next/font/google';
import { Borel } from 'next/font/google';
 
export const inter = Inter({ 
    subsets: ['latin'],
    weight: ['400', '500','600','700', '800']
});
export const outfit = Outfit({
    subsets: ['latin'],
    weight: ['100','200','300','400','500','600','700','800']
}); 
export const borel = Borel({
    subsets: ['latin'],
    weight: ['400']
});