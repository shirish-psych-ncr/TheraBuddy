import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import App from './App';
import StaffPortal from './StaffPortal';
import StaticStaffEntry from './StaticStaffEntry';
import './styles.css';

class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:boolean}> {
  state={error:false};
  static getDerivedStateFromError(){return {error:true};}
  render(){return this.state.error?<main className="startup"><h1>Let’s reopen your workspace.</h1><p>An unexpected error occurred. Your previously saved data remains on this device.</p><button onClick={()=>location.reload()}>Reload app</button></main>:this.props.children;}
}
// On GitHub Pages the staff portal is served from <base>staff.html because
// static hosts cannot rewrite /staff paths; on Workers the SPA fallback keeps
// using the /staff pathname. Check both so either entry renders the portal.
const path = location.pathname.toLowerCase();
const isStaff = path.startsWith('/staff') || /\/staff(\.html)?$/.test(path);
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary>{isStaff ? (import.meta.env.VITE_STATIC_HOST === "true" ? <StaticStaffEntry/> : <StaffPortal/>) : <App/>}</ErrorBoundary></React.StrictMode>);
