import { createRoot } from 'react-dom/client';
import ThemeLab from './app/page';
import './app/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
createRoot(root).render(<ThemeLab />);
