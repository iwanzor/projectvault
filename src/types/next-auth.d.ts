import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    userCode: string;
    username: string;
    branchCode: string;
    isAdmin: boolean;
    permissions: Permission[];
  }

  interface Session {
    user: {
      id: string;
      userCode: string;
      username: string;
      branchCode: string;
      isAdmin: boolean;
      permissions: Permission[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userCode: string;
    username: string;
    branchCode: string;
    isAdmin: boolean;
    permissions: Permission[];
  }
}

export interface Permission {
  module: string;
  viewAll: boolean;
  viewDetails: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
