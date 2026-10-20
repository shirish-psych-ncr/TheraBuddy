// Screen index & router for the complete brief inventory (docs/11-screen-inventory.md).
// Every screen ID gets a real, linked, breadcrumb-ed route (#/<FAMILY>/<NN>).
// Implemented areas render live workspace data; the rest render an honest
// specification card with cross-links and working breadcrumbs.
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, CaretRight, CheckCircle, ClipboardText, MagnifyingGlass } from '@phosphor-icons/react';
import { SCREENS } from './screens.data';

export type ScreenMeta = { title: string; purpose: string };

export type Family = { code: string; name: string; area: string; milestone: string; blurb: string; entry?: string };

export const FAMILIES: Family[] = [
  { code: 'PUB', name: 'Public entry', area: 'Marketing & access', milestone: 'M7/M9', blurb: 'Landing, features, pricing, legal pages and account entry points for centres evaluating Aasha.', entry: '/' },
  { code: 'AUTH', name: 'Identity', area: 'Accounts & security', milestone: 'M1/M2', blurb: 'Registration, verification, recovery, workspace selection and account-security management.' },
  { code: 'ONB', name: 'Centre onboarding', area: 'Setup wizard', milestone: 'M2/M3', blurb: 'Guided centre configuration: identity, disciplines, hours, rooms, staff, children, equipment, policies and activation.' },
  { code: 'MST', name: 'Centre workspace', area: 'Master dashboard', milestone: 'M4/M7', blurb: 'Centre-wide oversight: live status, exceptions, directories, clinical oversight, analytics and approvals.' },
  { code: 'STF', name: 'Staff lifecycle', area: 'People', milestone: 'M3/M9', blurb: 'Directory, invitations, credentials, permissions, shifts, caseloads, leave, workload and deactivation.' },
  { code: 'CHD', name: 'Child record', area: 'Children', milestone: 'M3/M9', blurb: 'Full child journey: registration, caregivers, consent, profiles, services, care team, timeline, discharge and retention.' },
  { code: 'CAL', name: 'Scheduling', area: 'Appointments', milestone: 'M4/M9', blurb: 'Calendars by branch/therapist/child/room, appointment lifecycle, conflicts, substitutions, waitlists and reminders.' },
  { code: 'ATT', name: 'Attendance', area: 'Daily registers', milestone: 'M4/M9', blurb: 'Child and staff registers, check-in/out, session state transitions, corrections, exceptions, makeups and exports.' },
  { code: 'THR', name: 'Therapist workspace', area: 'Session documentation', milestone: 'M5', blurb: 'The therapist’s day: preparation, live session recording, observations, measurements, notes, signing and handoffs.' },
  { code: 'ASM', name: 'Assessments', area: 'Clinical assessment', milestone: 'M6', blurb: 'Assessment lifecycle and the observation taxonomy that feeds intervention matching.' },
  { code: 'INT', name: 'Reviewed suggestions', area: 'Intervention catalogue', milestone: 'M6', blurb: 'Curated strategies with transparent rationale, eligibility review, comparison and governance.' },
  { code: 'ACT', name: 'Activities', area: 'Activity library', milestone: 'M5/M6', blurb: 'Searchable activity definitions, variants, mappings to goals/equipment, live logging and local approval workflow.' },
  { code: 'EQP', name: 'Equipment', area: 'Resources', milestone: 'M3/M6', blurb: 'Universal catalogue plus centre inventory: quantities, availability, checkout, maintenance and equipment-first discovery.' },
  { code: 'GOA', name: 'Goals & progress', area: 'Outcome measurement', milestone: 'M5/M6', blurb: 'Goal definition, baselines, measurement protocols, mastery criteria, longitudinal tracking and progress reviews.' },
  { code: 'COL', name: 'Collaboration', area: 'Care team', milestone: 'M6/M9', blurb: 'Handoffs, case discussions, supervisor reviews, caregiver communication and restricted-access clinical material.' },
  { code: 'RPT', name: 'Reports & analytics', area: 'Insight', milestone: 'M6/M9', blurb: 'Clinical progress reports, operational summaries, utilization analytics, exports and scheduled delivery.' },
  { code: 'CFG', name: 'Configuration', area: 'Centre settings', milestone: 'M2/M9', blurb: 'Everything configurable about the centre: branding, branches, services, roles, policies, catalogues, audit and retention.' },
  { code: 'PLT', name: 'Platform operations', area: 'Vendor back office', milestone: 'M7/M9', blurb: 'Tenant management, global catalogue governance, feature flags, support and platform health (vendor-only).' },
  { code: 'SYS', name: 'Shared system states', area: 'Cross-cutting UX', milestone: 'M1–M9', blurb: 'Loading, empty, error, offline, conflict, notification, profile and safety states reused across every area.' },
];

const familyOf = (id: string) => id.split('-')[0];

// Which screens are backed by real interactive behaviour in this demo build.
export const DEMO_LINKS: Record<string, string> = {
 'CHD-01':'/children', 'CAL-01':'/schedule', 'THR-01':'/overview',
 'ACT-01':'/library', 'CFG-01':'/settings', 'PUB-10':'/staff.html',
};

export function parseRoute(hash: string): { page: string; family?: string; screen?: string } {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts.length === 2 && /^[A-Z]{2,4}$/.test(parts[0]) && /^\d{2}$/.test(parts[1])) {
    return { page: 'screen', family: parts[0], screen: `${parts[0]}-${parts[1]}` };
  }
  if (parts[0] === 'families') return { page: parts[1] ? 'family' : 'index', family: parts[1] };
  return { page: parts[0] || 'overview' };
}

export function screenHref(id: string) { return `#/${id.split('-')[0]}/${id.split('-')[1]}`; }
export function familyHref(code: string) { return `#/families/${code}`; }

export function useHashRoute() {
  const [hash, setHash] = useState(location.hash || '#/');
  useEffect(() => {
    const onChange = () => setHash(location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return { hash, route: parseRoute(hash) };
}

export function Breadcrumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return <nav className="screen-crumbs" aria-label="Breadcrumb">{trail.map((t, i) => <Fragment key={t.href ?? t.label}>
    {i > 0 && <CaretRight size={12} aria-hidden="true" />}
    {t.href ? <a href={t.href}>{t.label}</a> : <strong aria-current="page">{t.label}</strong>}
  </Fragment>)}</nav>;
}

function RelatedLinks({ ids, note }: { ids: string[]; note?: string }) {
  if (!ids.length) return null;
  return <div className="screen-related">
    {note && <p className="subtle">{note}</p>}
    <ul>{ids.map(id => <li key={id}>
      <a href={screenHref(id)}><span className="screen-id">{id}</span> {SCREENS[id]?.title ?? id} <ArrowRight size={14} /></a>
    </li>)}</ul>
  </div>;
}

// Curated adjacency so sibling screens link richly even when titles don't share words.
const RELATED: Record<string, string[]> = {
  'PUB-01': ['PUB-02', 'PUB-03', 'PUB-04', 'PUB-05', 'PUB-07', 'PUB-08'],
  'PUB-02': ['PUB-01', 'PUB-03', 'PUB-04', 'MST-01', 'THR-08', 'GOA-01'],
  'PUB-03': ['PUB-02', 'PUB-05', 'ONB-01'],
  'PUB-04': ['MST-01', 'THR-01', 'ACT-01'],
  'PUB-05': ['PUB-06', 'CFG-26', 'PLT-04'],
  'PUB-06': ['PUB-08', 'SYS-19', 'PUB-07'],
  'PUB-07': ['PUB-09', 'ONB-01'],
  'PUB-08': ['CFG-25', 'CHD-29', 'SYS-25'],
  'PUB-09': ['AUTH-01', 'ONB-01', 'PUB-10'],
  'PUB-10': ['AUTH-05', 'PUB-11', 'SYS-24'],
  'PUB-11': ['STF-21', 'AUTH-08', 'ONB-13'],
  'AUTH-01': ['AUTH-02', 'AUTH-03', 'PUB-09'],
  'AUTH-02': ['AUTH-01', 'AUTH-04'],
  'AUTH-03': ['AUTH-11', 'AUTH-04'],
  'AUTH-04': ['AUTH-11', 'AUTH-05'],
  'AUTH-05': ['AUTH-11', 'AUTH-02'],
  'AUTH-06': ['AUTH-07', 'SYS-23', 'CFG-03'],
  'AUTH-07': ['AUTH-06', 'STF-06', 'THR-01'],
  'AUTH-08': ['STF-02', 'PUB-11'],
  'AUTH-09': ['STF-20', 'SYS-12', 'CFG-11'],
  'AUTH-10': ['SYS-07', 'THR-15', 'AUTH-04'],
  'AUTH-11': ['AUTH-03', 'AUTH-04', 'SYS-22'],
  'ONB-01': ['ONB-02', 'ONB-27', 'ONB-28'],
  'ONB-02': ['ONB-03', 'ONB-04', 'CFG-02'],
  'ONB-03': ['ONB-02', 'RPT-15', 'CFG-02'],
  'ONB-04': ['ONB-05', 'CFG-06'],
  'ONB-05': ['MST-14', 'CAL-02', 'CFG-03'],
  'ONB-06': ['ONB-07', 'CFG-04', 'STF-05'],
  'ONB-07': ['ONB-06', 'ONB-08', 'CHD-14'],
  'ONB-08': ['ASM-01', 'GOA-19', 'INT-01'],
  'ONB-09': ['CFG-06', 'STF-07', 'CAL-16'],
  'ONB-10': ['CFG-07', 'CAL-06'],
  'ONB-11': ['CFG-08', 'CAL-05', 'EQP-09'],
  'ONB-12': ['STF-01', 'ONB-13'],
  'ONB-13': ['STF-02', 'STF-03', 'ONB-14'],
  'ONB-14': ['STF-06', 'CFG-10', 'CFG-11'],
  'ONB-15': ['STF-07', 'ATT-05'],
  'ONB-16': ['CHD-01', 'ONB-26'],
  'ONB-17': ['CHD-02', 'CHD-03'],
  'ONB-18': ['EQP-02', 'EQP-04'],
  'ONB-19': ['EQP-01', 'EQP-05'],
  'ONB-20': ['EQP-06', 'EQP-25'],
  'ONB-21': ['EQP-20', 'STF-10', 'ACT-07'],
  'ONB-22': ['ASM-17', 'CFG-13', 'THR-13'],
  'ONB-23': ['CFG-19', 'THR-41', 'THR-42'],
  'ONB-24': ['CFG-12', 'COL-14', 'CHD-29'],
  'ONB-25': ['CHD-04', 'CFG-20', 'SYS-11'],
  'ONB-26': ['CFG-23', 'SYS-15', 'EQP-24'],
  'ONB-27': ['CFG-28', 'ONB-28'],
  'ONB-28': ['ONB-29', 'ONB-27'],
  'ONB-29': ['ONB-30', 'CFG-05'],
  'ONB-30': ['MST-01', 'THR-01', 'SYS-29'],
  'MST-01': ['MST-02', 'MST-12', 'THR-01'],
  'MST-02': ['CAL-01', 'ATT-01', 'MST-03'],
  'MST-03': ['ATT-13', 'CAL-14', 'MST-08'],
  'MST-04': ['CHD-01', 'MST-15'],
  'MST-05': ['STF-01', 'STF-15', 'ATT-05'],
  'MST-06': ['ASM-01', 'GOA-15', 'MST-08'],
  'MST-07': ['GOA-01', 'GOA-31', 'GOA-21'],
  'MST-08': ['THR-15', 'THR-41', 'RPT-27'],
  'MST-09': ['ATT-15', 'RPT-20', 'RPT-21'],
  'MST-10': ['CAL-05', 'EQP-10', 'RPT-25'],
  'MST-11': ['RPT-01', 'MST-16', 'RPT-28'],
  'MST-12': ['COL-10', 'SYS-17', 'MST-13'],
  'MST-13': ['STF-13', 'GOA-22', 'ASM-15'],
  'MST-14': ['CAL-02', 'RPT-30', 'CFG-03'],
  'MST-15': ['CHD-01', 'STF-01', 'CAL-01'],
  'MST-16': ['RPT-34', 'MST-11'],
  'STF-01': ['STF-02', 'MST-05'],
  'STF-02': ['PUB-11', 'STF-21', 'AUTH-08'],
  'STF-03': ['STF-04', 'STF-05'],
  'STF-04': ['STF-10', 'STF-03'],
  'STF-05': ['CFG-04', 'STF-06'],
  'STF-06': ['CFG-11', 'AUTH-09'],
  'STF-07': ['CAL-03', 'ATT-06'],
  'STF-08': ['CAL-03', 'THR-03'],
  'STF-09': ['CHD-15', 'THR-02'],
  'STF-10': ['EQP-18', 'ACT-07'],
  'STF-11': ['ATT-05', 'STF-12'],
  'STF-12': ['STF-13', 'CAL-16'],
  'STF-13': ['MST-13', 'STF-14'],
  'STF-14': ['CAL-15', 'STF-09'],
  'STF-15': ['RPT-23', 'STF-17'],
  'STF-16': ['RPT-27', 'MST-08'],
  'STF-17': ['STF-15', 'STF-11'],
  'STF-18': ['PLT-22', 'STF-10'],
  'STF-19': ['STF-20', 'CFG-24'],
  'STF-20': ['SYS-12', 'CHD-24', 'STF-19'],
  'STF-21': ['PUB-11', 'STF-22'],
  'STF-22': ['THR-12', 'THR-13'],
  'CHD-01': ['CHD-02', 'MST-04'],
  'CHD-02': ['CHD-03', 'CHD-04', 'CHD-05'],
  'CHD-03': ['CHD-10', 'COL-11'],
  'CHD-04': ['ONB-25', 'SYS-11', 'CHD-29'],
  'CHD-05': ['CHD-06', 'COL-09'],
  'CHD-06': ['GOA-02', 'ASM-07'],
  'CHD-07': ['CHD-08', 'ASM-04'],
  'CHD-08': ['CHD-13', 'THR-18'],
  'CHD-09': ['GOA-14', 'CHD-11'],
  'CHD-10': ['ASM-05', 'ACT-02'],
  'CHD-11': ['ASM-20', 'EQP-18'],
  'CHD-12': ['ACT-25', 'THR-26'],
  'CHD-13': ['THR-18', 'EQP-18', 'COL-10'],
  'CHD-14': ['ONB-07', 'CHD-15'],
  'CHD-15': ['STF-09', 'COL-01'],
  'CHD-16': ['CAL-07', 'CAL-06'],
  'CHD-17': ['ONB-27', 'CHD-18'],
  'CHD-18': ['CHD-19', 'GOA-01', 'THR-06'],
  'CHD-19': ['THR-09', 'ASM-18', 'CHD-24'],
  'CHD-20': ['COL-13', 'SYS-14'],
  'CHD-21': ['CHD-15', 'COL-02'],
  'CHD-22': ['COL-07', 'GOA-27'],
  'CHD-23': ['ATT-12', 'RPT-20'],
  'CHD-24': ['CFG-24', 'GOA-16'],
  'CHD-25': ['CHD-26', 'CHD-28'],
  'CHD-26': ['RPT-11', 'CHD-27'],
  'CHD-27': ['RPT-11', 'GOA-17'],
  'CHD-28': ['CHD-25', 'ONB-16'],
  'CHD-29': ['RPT-32', 'CFG-29', 'ONB-24'],
  'CHD-30': ['CFG-25', 'SYS-26'],
  'CAL-01': ['CAL-02', 'MST-02'],
  'CAL-02': ['CFG-03', 'MST-14'],
  'CAL-03': ['STF-08', 'THR-03'],
  'CAL-04': ['CHD-16', 'CAL-08'],
  'CAL-05': ['EQP-12', 'RPT-25'],
  'CAL-06': ['CAL-13', 'CHD-16'],
  'CAL-07': ['CAL-17', 'CAL-06'],
  'CAL-08': ['THR-07', 'ATT-02'],
  'CAL-09': ['CAL-14', 'CAL-19'],
  'CAL-10': ['ATT-11', 'CAL-11'],
  'CAL-11': ['ATT-14', 'CAL-13'],
  'CAL-12': ['ONB-16', 'CAL-13'],
  'CAL-13': ['CAL-05', 'STF-07'],
  'CAL-14': ['MST-03', 'CAL-09'],
  'CAL-15': ['STF-14', 'COL-02'],
  'CAL-16': ['CFG-09', 'STF-12'],
  'CAL-17': ['CFG-07', 'CAL-18'],
  'CAL-18': ['CAL-07', 'SYS-15'],
  'CAL-19': ['CFG-24', 'CAL-09'],
  'CAL-20': ['CFG-21', 'SYS-17'],
  'ATT-01': ['ATT-02', 'MST-02'],
  'ATT-02': ['ATT-03', 'ATT-04'],
  'ATT-03': ['ATT-01', 'CHD-23'],
  'ATT-04': ['ATT-03', 'COL-11'],
  'ATT-05': ['STF-11', 'ATT-06'],
  'ATT-06': ['STF-07', 'RPT-21'],
  'ATT-07': ['CFG-19', 'ATT-13'],
  'ATT-08': ['THR-07', 'THR-16'],
  'ATT-09': ['THR-32', 'ATT-10'],
  'ATT-10': ['THR-35', 'ATT-11'],
  'ATT-11': ['CAL-10', 'ATT-14'],
  'ATT-12': ['CHD-23', 'RPT-20'],
  'ATT-13': ['MST-03', 'ATT-07'],
  'ATT-14': ['CAL-11', 'RPT-22'],
  'ATT-15': ['RPT-29', 'MST-09'],
  'ATT-16': ['RPT-32', 'CFG-23'],
  'THR-01': ['THR-05', 'MST-01'],
  'THR-02': ['CHD-01', 'STF-09'],
  'THR-03': ['CAL-03', 'STF-08'],
  'THR-04': ['ATT-06', 'STF-11'],
  'THR-05': ['MST-08', 'THR-15'],
  'THR-06': ['CHD-18', 'THR-17'],
  'THR-07': ['ATT-08', 'THR-16'],
  'THR-08': ['THR-28', 'THR-35'],
  'THR-09': ['CHD-19', 'GOA-28'],
  'THR-10': ['ACT-19', 'INT-01'],
  'THR-11': ['GOA-23', 'GOA-31'],
  'THR-12': ['STF-22', 'SYS-22'],
  'THR-13': ['CFG-13', 'ASM-17'],
  'THR-14': ['COL-05', 'COL-06'],
  'THR-15': ['SYS-07', 'AUTH-10'],
  'THR-16': ['CAL-08', 'ATT-08'],
  'THR-17': ['GOA-11', 'THR-38'],
  'THR-18': ['CHD-13', 'EQP-18'],
  'THR-19': ['ASM-06', 'THR-33'],
  'THR-20': ['ASM-19', 'ASM-20'],
  'THR-21': ['ASM-21', 'ASM-22'],
  'THR-22': ['CHD-11', 'THR-23'],
  'THR-23': ['COL-02', 'GOA-14'],
  'THR-24': ['GOA-01', 'GOA-10'],
  'THR-25': ['INT-05', 'INT-07'],
  'THR-26': ['ACT-14', 'ACT-13'],
  'THR-27': ['EQP-08', 'EQP-16'],
  'THR-28': ['ACT-15', 'THR-30'],
  'THR-29': ['ACT-14', 'GOA-07'],
  'THR-30': ['GOA-13', 'GOA-29'],
  'THR-31': ['ASM-06', 'GOA-05'],
  'THR-32': ['COL-10', 'ATT-09'],
  'THR-33': ['THR-19', 'THR-35'],
  'THR-34': ['GOA-05', 'GOA-12'],
  'THR-35': ['THR-39', 'RPT-02'],
  'THR-36': ['COL-02', 'COL-03'],
  'THR-37': ['COL-11', 'COL-12'],
  'THR-38': ['GOA-10', 'THR-45'],
  'THR-39': ['RPT-13', 'THR-40'],
  'THR-40': ['SYS-10', 'ASM-14'],
  'THR-41': ['CFG-19', 'THR-42'],
  'THR-42': ['CHD-24', 'RPT-27'],
  'THR-43': ['THR-15', 'SYS-09'],
  'THR-44': ['RPT-02', 'CHD-19'],
  'THR-45': ['CAL-17', 'ACT-20'],
  'ASM-01': ['ASM-02', 'MST-06'],
  'ASM-02': ['ASM-03', 'CHD-17'],
  'ASM-03': ['PLT-06', 'ASM-17'],
  'ASM-04': ['CHD-07', 'ASM-18'],
  'ASM-05': ['CHD-10', 'GOA-25'],
  'ASM-06': ['THR-20', 'ASM-21'],
  'ASM-07': ['CHD-06', 'COL-11'],
  'ASM-08': ['GOA-05', 'ASM-16'],
  'ASM-09': ['CHD-11', 'GOA-20'],
  'ASM-10': ['GOA-02', 'INT-01'],
  'ASM-11': ['ASM-14', 'RPT-06'],
  'ASM-12': ['GOA-02', 'COL-09'],
  'ASM-13': ['GOA-04', 'GOA-05'],
  'ASM-14': ['THR-40', 'ASM-15'],
  'ASM-15': ['CFG-19', 'MST-13'],
  'ASM-16': ['RPT-07', 'GOA-31'],
  'ASM-17': ['CFG-13', 'PLT-07'],
  'ASM-18': ['CHD-19', 'ASM-25'],
  'ASM-19': ['ASM-20', 'THR-20'],
  'ASM-20': ['ASM-21', 'ASM-24'],
  'ASM-21': ['INT-03', 'PLT-07'],
  'ASM-22': ['GOA-31', 'THR-21'],
  'ASM-23': ['ASM-25', 'CFG-14'],
  'ASM-24': ['INT-04', 'GOA-07'],
  'ASM-25': ['PLT-12', 'INT-16'],
  'INT-01': ['INT-02', 'ACT-09'],
  'INT-02': ['INT-07', 'INT-16'],
  'INT-03': ['ASM-21', 'INT-05'],
  'INT-04': ['GOA-10', 'INT-08'],
  'INT-05': ['INT-06', 'THR-25'],
  'INT-06': ['CHD-13', 'STF-10'],
  'INT-07': ['INT-16', 'PLT-22'],
  'INT-08': ['ACT-03', 'INT-09'],
  'INT-09': ['EQP-13', 'EQP-16'],
  'INT-10': ['GOA-30', 'THR-09'],
  'INT-11': ['INT-12', 'INT-13'],
  'INT-12': ['THR-26', 'GOA-07'],
  'INT-13': ['INT-10', 'COL-04'],
  'INT-14': ['INT-15', 'CFG-15'],
  'INT-15': ['PLT-12', 'MST-13'],
  'INT-16': ['PLT-13', 'ASM-25'],
  'INT-17': ['ACT-23', 'EQP-22'],
  'ACT-01': ['ACT-02', 'THR-10'],
  'ACT-02': ['ASM-20', 'CHD-10'],
  'ACT-03': ['ACT-05', 'ACT-06'],
  'ACT-04': ['SYS-14', 'EQP-07'],
  'ACT-05': ['GOA-05', 'ACT-08'],
  'ACT-06': ['EQP-08', 'THR-27'],
  'ACT-07': ['CHD-13', 'STF-10'],
  'ACT-08': ['GOA-07', 'ACT-12'],
  'ACT-09': ['INT-08', 'PLT-09'],
  'ACT-10': ['ACT-11', 'ACT-20'],
  'ACT-11': ['ACT-22', 'ACT-21'],
  'ACT-12': ['GOA-05', 'THR-34'],
  'ACT-13': ['CHD-12', 'ACT-17'],
  'ACT-14': ['THR-26', 'ACT-15'],
  'ACT-15': ['THR-28', 'ACT-16'],
  'ACT-16': ['GOA-11', 'GOA-12'],
  'ACT-17': ['THR-09', 'ACT-18'],
  'ACT-18': ['GOA-28', 'ACT-16'],
  'ACT-19': ['THR-10', 'THR-13'],
  'ACT-20': ['ACT-21', 'CFG-16'],
  'ACT-21': ['MST-13', 'PLT-12'],
  'ACT-22': ['CHD-24', 'GOA-32'],
  'ACT-23': ['INT-17', 'EQP-22'],
  'ACT-24': ['EQP-15', 'EQP-17'],
  'ACT-25': ['GOA-10', 'INT-04'],
  'EQP-01': ['EQP-02', 'EQP-03'],
  'EQP-02': ['ACT-02', 'ASM-20'],
  'EQP-03': ['EQP-13', 'EQP-07'],
  'EQP-04': ['ONB-19', 'EQP-05'],
  'EQP-05': ['EQP-08', 'EQP-20'],
  'EQP-06': ['ONB-20', 'EQP-25'],
  'EQP-07': ['ACT-04', 'SYS-14'],
  'EQP-08': ['ONB-18', 'EQP-09'],
  'EQP-09': ['CAL-05', 'CFG-08'],
  'EQP-10': ['EQP-11', 'EQP-12'],
  'EQP-11': ['EQP-19', 'ATT-03'],
  'EQP-12': ['CAL-05', 'EQP-10'],
  'EQP-13': ['ACT-06', 'INT-09'],
  'EQP-14': ['GOA-25', 'GOA-26'],
  'EQP-15': ['ACT-24', 'EQP-16'],
  'EQP-16': ['THR-27', 'EQP-17'],
  'EQP-17': ['INT-05', 'ACT-24'],
  'EQP-18': ['CHD-13', 'ACT-07'],
  'EQP-19': ['RPT-26', 'EQP-11'],
  'EQP-20': ['EQP-21', 'ONB-21'],
  'EQP-21': ['CAL-14', 'EQP-23'],
  'EQP-22': ['EQP-23', 'INT-17'],
  'EQP-23': ['CFG-26', 'EQP-22'],
  'EQP-24': ['ONB-26', 'CFG-23'],
  'EQP-25': ['PLT-10', 'EQP-06'],
  'GOA-01': ['GOA-02', 'MST-07'],
  'GOA-02': ['GOA-03', 'CHD-06'],
  'GOA-03': ['GOA-19', 'PLT-11'],
  'GOA-04': ['ASM-13', 'GOA-05'],
  'GOA-05': ['ACT-12', 'THR-34'],
  'GOA-06': ['GOA-17', 'GOA-15'],
  'GOA-07': ['ACT-08', 'INT-12'],
  'GOA-08': ['COL-08', 'GOA-20'],
  'GOA-09': ['COL-05', 'MST-13'],
  'GOA-10': ['GOA-11', 'THR-24'],
  'GOA-11': ['ACT-16', 'GOA-24'],
  'GOA-12': ['GOA-24', 'RPT-08'],
  'GOA-13': ['THR-30', 'GOA-29'],
  'GOA-14': ['CHD-09', 'THR-23'],
  'GOA-15': ['GOA-16', 'GOA-34'],
  'GOA-16': ['CHD-24', 'GOA-22'],
  'GOA-17': ['GOA-06', 'RPT-08'],
  'GOA-18': ['GOA-15', 'GOA-31'],
  'GOA-19': ['CFG-17', 'PLT-11'],
  'GOA-20': ['COL-07', 'GOA-27'],
  'GOA-21': ['CAL-20', 'GOA-34'],
  'GOA-22': ['CFG-19', 'MST-13'],
  'GOA-23': ['GOA-24', 'GOA-31'],
  'GOA-24': ['RPT-08', 'GOA-12'],
  'GOA-25': ['GOA-26', 'GOA-27'],
  'GOA-26': ['GOA-25', 'RPT-04'],
  'GOA-27': ['COL-08', 'RPT-05'],
  'GOA-28': ['ACT-18', 'GOA-32'],
  'GOA-29': ['THR-30', 'GOA-13'],
  'GOA-30': ['INT-10', 'ACT-18'],
  'GOA-31': ['ASM-16', 'GOA-15'],
  'GOA-32': ['GOA-05', 'ACT-22'],
  'GOA-33': ['COL-12', 'ASM-07'],
  'GOA-34': ['RPT-09', 'GOA-15'],
  'COL-01': ['CHD-15', 'COL-16'],
  'COL-02': ['THR-36', 'COL-03'],
  'COL-03': ['COL-02', 'THR-06'],
  'COL-04': ['INT-13', 'COL-07'],
  'COL-05': ['THR-14', 'COL-06'],
  'COL-06': ['GOA-09', 'MST-06'],
  'COL-07': ['GOA-20', 'CHD-22'],
  'COL-08': ['GOA-08', 'RPT-05'],
  'COL-09': ['CHD-05', 'ASM-12'],
  'COL-10': ['THR-32', 'MST-12'],
  'COL-11': ['CHD-03', 'THR-37'],
  'COL-12': ['RPT-10', 'GOA-33'],
  'COL-13': ['CHD-20', 'SYS-14'],
  'COL-14': ['CFG-12', 'ONB-24'],
  'COL-15': ['THR-05', 'SYS-17'],
  'COL-16': ['CFG-24', 'COL-01'],
  'RPT-01': ['RPT-12', 'MST-11'],
  'RPT-02': ['THR-35', 'THR-44'],
  'RPT-03': ['GOA-25', 'RPT-08'],
  'RPT-04': ['GOA-26', 'RPT-08'],
  'RPT-05': ['COL-08', 'GOA-27'],
  'RPT-06': ['ASM-11', 'ASM-15'],
  'RPT-07': ['ASM-16', 'RPT-06'],
  'RPT-08': ['GOA-24', 'GOA-17'],
  'RPT-09': ['GOA-34', 'GOA-21'],
  'RPT-10': ['COL-12', 'ONB-24'],
  'RPT-11': ['CHD-27', 'CHD-26'],
  'RPT-12': ['RPT-31', 'RPT-13'],
  'RPT-13': ['THR-39', 'RPT-14'],
  'RPT-14': ['GOA-32', 'RPT-16'],
  'RPT-15': ['ONB-03', 'RPT-16'],
  'RPT-16': ['CFG-19', 'MST-13'],
  'RPT-17': ['RPT-18', 'CFG-25'],
  'RPT-18': ['CHD-29', 'CFG-24'],
  'RPT-19': ['MST-01', 'MST-03'],
  'RPT-20': ['ATT-15', 'CHD-23'],
  'RPT-21': ['STF-11', 'ATT-06'],
  'RPT-22': ['ATT-14', 'CAL-10'],
  'RPT-23': ['STF-15', 'RPT-24'],
  'RPT-24': ['CFG-04', 'RPT-28'],
  'RPT-25': ['CAL-05', 'MST-10'],
  'RPT-26': ['EQP-19', 'EQP-20'],
  'RPT-27': ['MST-08', 'STF-16'],
  'RPT-28': ['CAL-01', 'MST-11'],
  'RPT-29': ['ATT-13', 'CAL-10'],
  'RPT-30': ['MST-14', 'CFG-03'],
  'RPT-31': ['RPT-12', 'CFG-23'],
  'RPT-32': ['CFG-29', 'CHD-29'],
  'RPT-33': ['CFG-21', 'CAL-20'],
  'RPT-34': ['MST-16', 'THR-13'],
  'CFG-01': ['CFG-02', 'ONB-28'],
  'CFG-02': ['ONB-02', 'RPT-15'],
  'CFG-03': ['ONB-05', 'MST-14'],
  'CFG-04': ['ONB-06', 'STF-05'],
  'CFG-05': ['ONB-08', 'PLT-15'],
  'CFG-06': ['ONB-09', 'CAL-16'],
  'CFG-07': ['ONB-10', 'CAL-17'],
  'CFG-08': ['ONB-11', 'CAL-05'],
  'CFG-09': ['CAL-16', 'ONB-09'],
  'CFG-10': ['ONB-14', 'CFG-11'],
  'CFG-11': ['STF-06', 'AUTH-09'],
  'CFG-12': ['ONB-24', 'COL-14'],
  'CFG-13': ['ONB-22', 'ASM-17'],
  'CFG-14': ['ASM-23', 'PLT-07'],
  'CFG-15': ['INT-14', 'PLT-08'],
  'CFG-16': ['ACT-20', 'PLT-09'],
  'CFG-17': ['GOA-03', 'GOA-19'],
  'CFG-18': ['EQP-01', 'EQP-25'],
  'CFG-19': ['ONB-23', 'THR-41'],
  'CFG-20': ['ONB-25', 'CHD-04'],
  'CFG-21': ['CAL-20', 'SYS-18'],
  'CFG-22': ['PLT-24', 'SYS-21'],
  'CFG-23': ['ONB-26', 'RPT-32'],
  'CFG-24': ['COL-16', 'PLT-17'],
  'CFG-25': ['CHD-30', 'SYS-26'],
  'CFG-26': ['PLT-05', 'PUB-05'],
  'CFG-27': ['PLT-15', 'CFG-05'],
  'CFG-28': ['ONB-27', 'CFG-01'],
  'CFG-29': ['RPT-32', 'PLT-19'],
  'CFG-30': ['PLT-03', 'CFG-25'],
  'PLT-01': ['PLT-02', 'PLT-18'],
  'PLT-02': ['PLT-03', 'CFG-01'],
  'PLT-03': ['ONB-01', 'PLT-14'],
  'PLT-04': ['PUB-05', 'PLT-05'],
  'PLT-05': ['CFG-26', 'PLT-04'],
  'PLT-06': ['ASM-03', 'PLT-13'],
  'PLT-07': ['ASM-21', 'ASM-25'],
  'PLT-08': ['INT-16', 'INT-17'],
  'PLT-09': ['ACT-09', 'ACT-22'],
  'PLT-10': ['EQP-25', 'EQP-01'],
  'PLT-11': ['GOA-03', 'GOA-19'],
  'PLT-12': ['INT-15', 'ASM-25'],
  'PLT-13': ['PLT-15', 'INT-16'],
  'PLT-14': ['ONB-01', 'PLT-03'],
  'PLT-15': ['CFG-05', 'CFG-27'],
  'PLT-16': ['PUB-07', 'PLT-20'],
  'PLT-17': ['CFG-24', 'PLT-25'],
  'PLT-18': ['SYS-13', 'PLT-20'],
  'PLT-19': ['CFG-29', 'SYS-30'],
  'PLT-20': ['AUTH-09', 'SYS-12'],
  'PLT-21': ['MST-11', 'PLT-01'],
  'PLT-22': ['INT-07', 'STF-18'],
  'PLT-23': ['CAL-20', 'CFG-26'],
  'PLT-24': ['CFG-22', 'SYS-21'],
  'PLT-25': ['PLT-17', 'CFG-11'],
  'SYS-01': ['SYS-02', 'SYS-05'],
  'SYS-02': ['ONB-16', 'STF-01'],
  'SYS-03': ['CFG-11', 'SYS-12'],
  'SYS-04': ['MST-15', 'SYS-03'],
  'SYS-05': ['SYS-06', 'THR-15'],
  'SYS-06': ['SYS-05', 'CFG-21'],
  'SYS-07': ['THR-15', 'AUTH-10'],
  'SYS-08': ['CAL-09', 'SYS-09'],
  'SYS-09': ['THR-43', 'SYS-08'],
  'SYS-10': ['THR-40', 'GOA-32'],
  'SYS-11': ['CHD-04', 'ACT-07'],
  'SYS-12': ['STF-20', 'AUTH-09'],
  'SYS-13': ['PLT-18', 'SYS-30'],
  'SYS-14': ['CHD-20', 'EQP-07'],
  'SYS-15': ['ONB-26', 'EQP-24'],
  'SYS-16': ['RPT-32', 'ATT-16'],
  'SYS-17': ['CAL-20', 'COL-15'],
  'SYS-18': ['CFG-21', 'SYS-17'],
  'SYS-19': ['PUB-06', 'SYS-29'],
  'SYS-20': ['PLT-16', 'PUB-07'],
  'SYS-21': ['CFG-22', 'PLT-24'],
  'SYS-22': ['THR-12', 'AUTH-11'],
  'SYS-23': ['AUTH-06', 'MST-14'],
  'SYS-24': ['AUTH-10', 'SYS-22'],
  'SYS-25': ['CFG-25', 'CHD-29'],
  'SYS-26': ['CHD-30', 'CFG-25'],
  'SYS-27': ['STF-20', 'CFG-30'],
  'SYS-28': ['PLT-04', 'CFG-05'],
  'SYS-29': ['ONB-30', 'SYS-19'],
  'SYS-30': ['PLT-19', 'SYS-13'],
};

export function screensForFamily(code: string) {
  return Object.keys(SCREENS).filter(id => familyOf(id) === code);
}

// Every screen links to its siblings and its family index, so the graph is fully connected.
function relatedFor(id: string): string[] {
  const curated = (RELATED[id] ?? []).filter(r => SCREENS[r]);
  const siblings = screensForFamily(familyOf(id)).filter(s => s !== id && !curated.includes(s));
  return [...curated, ...siblings.slice(0, 4)];
}

export function searchScreens(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const ids = Object.keys(SCREENS);
  const scored = ids.map(id => {
    const m = SCREENS[id]; const fam = FAMILIES.find(f => f.code === familyOf(id))!;
    const hay = `${id} ${m.title} ${m.purpose} ${fam.name} ${fam.area}`.toLowerCase();
    if (hay.startsWith(q) || id.toLowerCase().startsWith(q)) return { id, score: 0 };
    if (hay.includes(q)) return { id, score: 1 };
    return null;
  }).filter(Boolean) as { id: string; score: number }[];
  return scored.sort((a, b) => a.score - b.score || a.id.localeCompare(b.id)).slice(0, 40).map(s => s.id);
}

export function familyStats() {
  return FAMILIES.map(f => {
    const ids = screensForFamily(f.code);
    const done = ids.filter(id => DEMO_LINKS[id]).length;
    return { ...f, total: ids.length, done };
  });
}

export function ScreenRouter({ children }: { children: (route: { page: string; family?: string; screen?: string }) => ReactNode }) {
  const { route } = useHashRoute();
  return <>{children(route)}</>;
}

export function ScreenIndexPage() {
  const stats = useMemo(familyStats, []);
  const [query, setQuery] = useState('');
  const matches = searchScreens(query);
  const done = stats.reduce((n, f) => n + f.done, 0);
  const total = stats.reduce((n, f) => n + f.total, 0);
  return <div className="screen-index">
    <Breadcrumbs trail={[{ label: 'Workspace', href: '#/overview' }, { label: 'Screens', href: '#/screens' }, { label: 'Index' }]} />
    <div className="page-heading"><div><div className="eyebrow">COMPLETE BRIEF MAP · {total} SCREENS</div><h1>Every screen in the product brief.</h1><p>All {total} brief entries are linked below. {done} have a related demo shortcut; a shortcut does not mean the full feature is implemented.</p></div></div>
    <label className="search screen-search"><MagnifyingGlass size={18} /><input aria-label="Search all screens" placeholder="Search 462 screens by ID, name or purpose…" value={query} onChange={e => setQuery(e.target.value)} /></label>
    {query && <div className="panel padded screen-results">{matches.length ? matches.map(id => <a className="screen-result" key={id} href={screenHref(id)}><span className="screen-id">{id}</span><span><strong>{SCREENS[id].title}</strong><small>{SCREENS[id].purpose}</small></span>{DEMO_LINKS[id] ? <span className="badge green">Demo link</span> : <span className="badge">Spec</span>}<ArrowRight size={16} /></a>) : <p className="subtle">No screens match “{query}”.</p>}</div>}
    {!query && <div className="family-grid">{stats.map(f => <a className="panel family-card" key={f.code} href={familyHref(f.code)}>
      <div className="card-top"><span className="family-code">{f.code}</span><span className="badge">{f.milestone}</span></div>
      <h2>{f.name}</h2><p>{f.blurb}</p>
      <div className="progress-track" role="img" aria-label={`${f.done} of ${f.total} entries with related demo shortcuts`}><div className="progress-fill" style={{ width: `${Math.max(4, Math.round((f.done / f.total) * 100))}%` }} /></div>
      <small>{f.done}/{f.total} demo links · {f.total} screens</small>
    </a>)}</div>}
    <footer className="screen-index-footer"><CheckCircle size={16} /><span>Browse all 462 brief entries across 19 areas.</span></footer>
  </div>;
}

export function FamilyPage({ code, navigate }: { code: string; navigate: (page: string) => void }) {
  const family = FAMILIES.find(f => f.code === code);
  if (!family) return <NotFound what={`family “${code}”`} />;
  const ids = screensForFamily(code);
  const idx = FAMILIES.findIndex(f => f.code === code);
  const prev = FAMILIES[idx - 1], next = FAMILIES[idx + 1];
  return <div className="family-page">
    <Breadcrumbs trail={[{ label: 'Workspace', href: '#/overview' }, { label: 'Screens', href: '#/screens' }, { label: family.name }]} />
    <div className="page-heading"><div><div className="eyebrow">{family.area.toUpperCase()} · {family.milestone}</div><h1>{family.name}</h1><p>{family.blurb}</p></div>{family.entry && !family.entry.includes('staff') && <button className="button" onClick={() => navigate(family.entry!.replace('/', '') || 'overview')}><ArrowRight size={18}/> Enter demo</button>}{family.entry?.includes('staff') && <a className="button" href={import.meta.env.BASE_URL + 'staff.html'}>Open staff portal <ArrowRight size={18} /></a>}</div>
    <div className="family-nav">{prev && <a className="text-button" href={familyHref(prev.code)}>← {prev.name}</a>}<span className="subtle">{ids.length} screens</span>{next && <a className="text-button" href={familyHref(next.code)}>{next.name} →</a>}</div>
    <div className="screen-list panel">{ids.map(id => {
      const meta = SCREENS[id]; const live = DEMO_LINKS[id];
      return <div className="screen-row" key={id}>
        <a className="screen-row-main" href={screenHref(id)}>
          <span className="screen-id">{id}</span>
          <span className="screen-row-text"><strong>{meta.title}</strong><small>{meta.purpose}</small></span>
        </a>
        {live ? <a className="button small soft" href={live.includes('staff') ? import.meta.env.BASE_URL + 'staff.html' : '#/' + (live.slice(1) || 'overview')}>Open related demo <ArrowRight size={14} /></a> : <a className="badge" href={screenHref(id)}>Specification</a>}
        <a className="text-button subtle-link" href={screenHref(id)}>Details <ArrowRight size={14} /></a>
      </div>;
    })}</div>
  </div>;
}

export function ScreenPage({ id, navigate }: { id: string; navigate: (page: string) => void }) {
  const meta = SCREENS[id];
  if (!meta) return <NotFound what={`screen “${id}”`} />;
  const family = FAMILIES.find(f => f.code === familyOf(id))!;
  const ids = screensForFamily(family.code);
  const pos = ids.indexOf(id);
  const prev = ids[pos - 1], next = ids[pos + 1];
  const related = [...new Set(relatedFor(id))];
  const live = DEMO_LINKS[id];
  const liveTarget = live ? (live.replace(/^\/|\/staff\.html$/g, '') || 'overview') : '';
  return <article className="screen-page">
    <Breadcrumbs trail={[{ label: 'Workspace', href: '#/overview' }, { label: 'Screens', href: '#/screens' }, { label: family.name, href: familyHref(family.code) }, { label: id }]} />
    <header className="screen-header"><div><div className="eyebrow">{family.name.toUpperCase()} · {family.area.toUpperCase()} · MILESTONE {family.milestone}</div><h1>{meta.title}</h1><p>{meta.purpose}</p></div><div className="screen-badges">{live ? <span className="badge green"><CheckCircle size={13} /> Related demo available</span> : <span className="badge amber">Backlog · specification</span>}<span className="screen-id">{id}</span></div></header>
    {live && <div className="update-banner"><ClipboardText size={18} /><span>A related demonstration is available. The complete brief feature is still backlog.</span>{live.startsWith('/') && !live.includes('staff') && <button className="button small" onClick={() => navigate(liveTarget)}>Open related demo <ArrowRight size={16} /></button>}{live.includes('staff') && <a className="button small" href={import.meta.env.BASE_URL + 'staff.html'}>Open staff portal <ArrowRight size={16} /></a>}</div>}
    {!live && <div className="field-note">This is a backlog screen from the product brief. This page summarizes its purpose and links to related entries; implementation is planned in milestone {family.milestone}. Nothing on this page stores or transmits data.</div>}
    <section className="panel padded"><h2>What this screen does</h2><p className="section-description">{meta.purpose}</p>
      <dl className="screen-spec"><dt>Screen ID</dt><dd>{id}</dd><dt>Area</dt><dd>{family.name} ({family.code}) — {family.area}</dd><dt>Milestone band</dt><dd>{family.milestone}</dd><dt>Status</dt><dd>{'Backlog / full feature not implemented'}</dd>{live && <><dt>Related demo</dt><dd>{liveTarget === 'overview' ? 'Workspace overview' : live}</dd></>}{family.entry && <><dt>Demo entry point</dt><dd>{family.entry}</dd></>}</dl>
    </section>
    <RelatedLinks ids={related} note="Linked screens in the brief:" />
    <nav className="screen-pager" aria-label="Sibling screens">
      {prev ? <a href={screenHref(prev)}><ArrowLeft size={14} /> {prev} · {SCREENS[prev].title}</a> : <a href={familyHref(family.code)}>← All {family.name} screens</a>}
      {next ? <a href={screenHref(next)}>{next} · {SCREENS[next].title} <ArrowRight size={14} /></a> : <a href={familyHref(family.code)}>All {family.name} screens →</a>}
    </nav>
  </article>;
}

export function NotFound({ what }: { what: string }) {
  return <div className="screen-page"><Breadcrumbs trail={[{ label: 'Workspace', href: '#/overview' }, { label: 'Screens', href: '#/screens' }, { label: 'Not found' }]} />
    <div className="empty"><h3>Screen not found</h3><p>{what} isn’t in the brief inventory. Browse the full map instead.</p><a className="button secondary" href="#/screens">Open screen index <ArrowRight size={16} /></a></div></div>;
}
