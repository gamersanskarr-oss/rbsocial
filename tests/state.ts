/* Mutable "who is logged in" for tests — the @/lib/auth mock reads this. */

export type TestUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string | null;
};

export const EMPLOYEE: TestUser = {
  id: "emp1",
  name: "Priya Sharma",
  email: "priya@pixeldesk.com",
  role: "EMPLOYEE",
  team: "DESIGN",
};
export const OTHER_EMPLOYEE: TestUser = {
  id: "emp2",
  name: "Rahul Verma",
  email: "rahul@pixeldesk.com",
  role: "EMPLOYEE",
  team: "DESIGN",
};
export const ADMIN: TestUser = {
  id: "adm1",
  name: "Admin",
  email: "admin@pixeldesk.com",
  role: "ADMIN",
  team: null,
};
export const MANAGER: TestUser = {
  id: "mgr1",
  name: "Manager",
  email: "manager@pixeldesk.com",
  role: "MANAGER",
  team: null,
};

export const authState: { user: TestUser } = { user: EMPLOYEE };
