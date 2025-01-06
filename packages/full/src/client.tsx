import { createRoot } from 'react-dom/client';
import { Chat } from './chat';

const initialProps = (window as any).__INITIAL_PROPS__ || {}

const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(<Chat {...initialProps} />);
}