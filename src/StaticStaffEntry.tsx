export default function StaticStaffEntry() {
  let target = '';
  try {
    const url = new URL(import.meta.env.VITE_API_BASE || '');
    if (url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash) target = url.origin + '/staff';
  } catch { /* Unconfigured deployments show setup status. */ }
  return <main className="startup"><nav aria-label="Breadcrumb"><a href={import.meta.env.BASE_URL + '#/overview'}>Workspace</a> / <span aria-current="page">Staff access</span></nav><h1>Staff access</h1><p>This static site is a synthetic demo. Staff sign-in and organization permissions run on the separate secure server.</p>{target ? <a className="button" href={target}>Open secure staff portal</a> : <p>The staff server is not connected yet. Set the public VITE_API_BASE repository variable to the deployed server’s HTTPS origin, then rebuild this site.</p>}<p><a href={import.meta.env.BASE_URL + '#/screens'}>Browse the screen directory</a></p></main>;
}
