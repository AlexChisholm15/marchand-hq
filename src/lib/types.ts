export type RoleId = 'owner' | 'coo' | 'office' | 'designer' | 'pm' | 'homeowner' | 'realtor';

export type Role = {
  id: RoleId;
  label: string;
  person: string;
  title: string;
};

export type Community = 'Kinloch Estates' | 'Indigo Shores' | 'Truro' | 'Bridgewater';

export type HomeStatus = 'presold' | 'spec' | 'closed';

export type Home = {
  id: string;
  lot: string;
  civic: number;
  street: string;
  community: Community;
  plan: string;
  style: 'Bungalow' | 'Two storey' | 'Split entry';
  beds: number;
  baths: number;
  sqft: number;
  status: HomeStatus;
  stage: number;
  buyer: string | null;
  realtor: string | null;
  pm: string;
  designer: string;
  contractPrice: number;
  listPrice: number;
  deposit: number;
  closing: string | null;
  cost: number;
  spent: number;
  behindWeeks: number;
};

export type Selection = {
  id: string;
  homeId: string;
  room: string;
  choice: string;
  status: 'pending' | 'confirmed';
};

export type ChangeStatus = 'requested' | 'priced' | 'approved' | 'declined';

export type Change = {
  id: string;
  homeId: string;
  number: number | null;
  title: string;
  detail: string;
  room: string;
  status: ChangeStatus;
  price: number | null;
  cost: number | null;
  requestedOn: string;
  pricedOn: string | null;
  decidedOn: string | null;
};

export type TaskSource = 'Selections' | 'Change order' | 'Site' | 'Office' | 'Closing' | 'Sales' | 'Trades' | 'Cash';

export type ActionKind =
  | 'done'
  | 'confirm-selections'
  | 'request-change'
  | 'price-change'
  | 'approve-change'
  | 'prepare-amendment'
  | 'sign-amendment'
  | 'update-adjustments'
  | 'confirm-trade'
  | 'move-closing'
  | 'open-money';

export type Task = {
  id: string;
  role: RoleId;
  homeId: string | null;
  title: string;
  detail: string;
  due: string;
  source: TaskSource;
  owner: string;
  action: ActionKind;
  ref: string | null;
  status: 'open' | 'done';
  doneOn: string | null;
};

export type TradeItem = {
  id: string;
  homeId: string;
  trade: string;
  company: string;
  scope: string;
  neededBy: string;
  status: 'waiting' | 'ready';
  changeId: string | null;
};

export type Update = {
  id: string;
  homeId: string;
  date: string;
  stage: string;
  note: string;
  by: string;
  audience: 'team' | 'homeowner';
};

export type DemoEvent =
  | { type: 'selections.confirmed'; homeId: string; at: string }
  | { type: 'change.requested'; changeId: string; homeId: string; title: string; detail: string; room: string; at: string }
  | { type: 'change.priced'; changeId: string; price: number; cost: number; at: string }
  | { type: 'change.approved'; changeId: string; at: string }
  | { type: 'change.declined'; changeId: string; at: string }
  | { type: 'amendment.sent'; changeId: string; at: string }
  | { type: 'amendment.signed'; changeId: string; at: string }
  | { type: 'adjustments.updated'; changeId: string; at: string }
  | { type: 'trade.confirmed'; tradeId: string; at: string }
  | { type: 'closing.moved'; homeId: string; days: number; reason: string; at: string }
  | { type: 'task.done'; taskId: string; at: string };

export type Activity = {
  id: string;
  at: string;
  who: string;
  text: string;
  homeId: string | null;
};

export type State = {
  today: string;
  homes: Home[];
  selections: Selection[];
  changes: Change[];
  tasks: Task[];
  trades: TradeItem[];
  updates: Update[];
  activity: Activity[];
  closingMoves: Record<string, number>;
};
