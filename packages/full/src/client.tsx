import { createRoot } from 'react-dom/client';
import Chat from './chat';

const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(<Chat />);
}