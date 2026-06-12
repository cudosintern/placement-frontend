import { ComponentType } from "react";
import { EMSROUTE } from "./emsRoute";
// import { ADMISSIONROUTE } from "./admissionRoute";
// import { TRANSPORTROUTE } from "./transportRoute";
// import { HOSTELROUTE } from "./hostelRoute";
import { MAINROUTE } from "./mainRoute";
// import { CUDOSROUTE } from "./cudosRoute";
import PLACEMENTROUTE from "./placementRoute";

export interface RouteItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  element: ComponentType<any>;
  subItems?: RouteItem[];
  roles?: string[];
  hidden?: boolean;
}

export interface RoleRoutes {
  [key: string]: RouteItem[];
}

export const roleRoutes: RoleRoutes = {
  // Use Placement routes as the default/main routes so the UI shows
  // only the Placement Management System as requested.
  main: PLACEMENTROUTE,
  ionems: PLACEMENTROUTE,
  // ioncudos: CUDOSROUTE,
  // ionadmission: ADMISSIONROUTE,
  // iontransport: TRANSPORTROUTE,
  // ionhostel: HOSTELROUTE,
  ionplacement: PLACEMENTROUTE,
};
