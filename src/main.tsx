import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/app.css';
import './styles/base.css';
import App from './app/App';
import { createBrowserPorts } from './app/adapters/browserPorts';
import { bootStudio } from './app/services/startup';

const ports = createBrowserPorts();
const initial = bootStudio(ports.storage, ports.sharing.getHash());
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App ports={ports} initial={initial} />
  </StrictMode>,
);
