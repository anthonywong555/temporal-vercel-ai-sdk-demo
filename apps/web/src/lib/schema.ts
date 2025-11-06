export interface ServiceAction {
  name: string;
  action: () => void;
}

export interface ServiceSchema {
  name: string;
  status: boolean;
  url?: string;
  actions?: ServiceAction[],
}