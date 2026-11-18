export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  studioName?: string;
}

export const mockUser: User = {
  id: "usr_star_01",
  name: "Alex Vance",
  email: "alex@stargraph.io",
  role: "Studio Director",
  studioName: "StarGraph Creative Lab",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
};

