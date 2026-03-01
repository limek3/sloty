export type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type AuthContext = {
  tgUser: TgUser;
  rawInitData: string;
};
