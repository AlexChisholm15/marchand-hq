import type { Role, RoleId } from './types.ts';

// Staff names are real Marchand Homes team members, used with the founder's permission.
// Every buyer, street, civic number and dollar figure is sample data.
export const ROLES: Role[] = [
  { id: 'owner', label: 'Jeff', person: 'Jeff Marchand', title: 'Owner' },
  { id: 'coo', label: 'Scott', person: 'Scott Sim', title: 'COO' },
  { id: 'office', label: 'Office', person: 'Sandy Brewster', title: 'Business Manager' },
  { id: 'designer', label: 'Designer', person: 'Jorelle Miller', title: 'Home Design Specialist' },
  { id: 'pm', label: 'Project Manager', person: 'Gerry England', title: 'Project Manager' },
  { id: 'homeowner', label: 'Homeowner', person: 'Nora Whitfield', title: 'Homeowner' },
  { id: 'realtor', label: 'Realtor', person: 'Alex Chisholm', title: 'Realtor, Chisholm Group' },
];

export const roleById = (id: RoleId): Role => ROLES.find((r) => r.id === id)!;

export const STAFF = {
  owner: 'Jeff Marchand',
  coo: 'Scott Sim',
  business: 'Sandy Brewster',
  admin: 'Leigh England',
  pm: 'Gerry England',
  designerA: 'Jorelle Miller',
  designerB: 'Miranda Prosser',
  realtor: 'Alex Chisholm',
  // Made-up names below.
  pmB: 'Dale Comeau',
  pmC: 'Owen Taggart',
};

export const DEMO_HOME_ID = 'h01';
export const DEMO_BUYER = 'Nora & Ethan Whitfield';

export type NavId = 'today' | 'homes' | 'changes' | 'money' | 'more';

export type NavItem = { id: NavId; label: string; href: string };

export function navFor(role: RoleId): NavItem[] {
  const homes: NavItem =
    role === 'homeowner'
      ? { id: 'homes', label: 'My home', href: `/homes/${DEMO_HOME_ID}` }
      : { id: 'homes', label: 'Homes', href: '/homes' };
  const items: NavItem[] = [
    { id: 'today', label: 'Today', href: '/' },
    homes,
    { id: 'changes', label: 'Changes', href: '/changes' },
  ];
  if (canSeeMoney(role)) items.push({ id: 'money', label: 'Money', href: '/money' });
  items.push({ id: 'more', label: 'More', href: '/more' });
  return items;
}

export const canSeeMoney = (role: RoleId) => role === 'owner' || role === 'office';

/** Internal numbers (cost, margin, debt) never reach buyers or realtors. */
export const canSeeInternal = (role: RoleId) => role !== 'homeowner' && role !== 'realtor';
