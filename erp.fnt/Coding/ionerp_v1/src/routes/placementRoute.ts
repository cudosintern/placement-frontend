import Home from "../pages/ems/home";

import DepartmentPage from "../pages/ems/configuration/departmentDetail/departmentPage";
import CompanyList from "../pages/placement/master/company/CompanyList";

import { Outlet } from "react-router-dom";
import CompanyContactPage from "../pages/placement/master/company-contact/companyContactPage";
import ChangePasswordPage from "../pages/changepassword";
import {
  StudentRegistrationWrapper,
  StudentProfileWrapper,
  StudentSkillWrapper,
  StudentCertificationWrapper,
} from "../pages/placement/student/studentRoutes";
import AvailableDrivesPage from "../pages/placement/student/AvailableDrivesPage";
import NotificationTemplatePage from "../pages/placement/master/notification-template/notificationTemplatePage";
import NotificationLogPage from "../pages/placement/master/notification-log/NotificationLogPage";
import EventTypePage from "../pages/placement/master/event-type/eventTypePage";

import CompanyRegistrationPage from "../pages/placement/master/companyRegistration/companyRegistrationPage";
import CompanyApprovalPage from "../pages/placement/tpoDashboard/companyApprovalPage";
import DrivePage from "../pages/placement/tpoDashboard/drivePage";

export const PLACEMENTROUTE = [
  {
    name: "Home",
    href: "/",
    element: Home,
    roles: [],
    subItems: [],
  },
  {
    name: "Change Password",
    href: "/change_password",
    element: ChangePasswordPage,
    roles: [],
    subItems: [],
  },
  {
    name: "Master",
    href: "",
    element: Outlet,
    roles: [],
    subItems: [
      {
        name: "Placement Module",
        href: "",
        roles: [],
        element: Outlet,
        subItems: [
          {
            name: "Applications",
            href: "plm/applications",
            roles: [],
            element: require("../pages/placement/plm/ApplicationList").default,
            subItems: [],
          },
          {
            name: "Shortlist",
            href: "plm/shortlist",
            roles: [],
            element: require("../pages/placement/plm/ShortlistManagement").default,
            subItems: [],
          },
          {
            name: "Waitlist",
            href: "plm/waitlist",
            roles: [],
            element: require("../pages/placement/plm/WaitlistManagement").default,
            subItems: [],
          },
        ],
      },
      {
        name: "Company Contact",
        href: "company-contact",
        roles: [],
        element: CompanyContactPage,
        subItems: [],
      },
       {
    name: "Notification Template",
    href: "notification-template",
    roles: [],
    element: NotificationTemplatePage,
    subItems: [],
  },

  {
  name: "Notification Log",
  href: "notification-log",
  roles: [],
  element: NotificationLogPage,
  subItems: [],
},

{
  name: "Event Type",
  href: "event-type",
  roles: [],
  element: EventTypePage,
  subItems: [],
},
      {
        name: "Configuration",
        href: "",
        element: Outlet,
        roles: [],
        subItems: [
          {
            name: "Department",
            href: "department",
            roles: [],
            element: DepartmentPage,
            subItems: [],
          },
          {
            name: "Company",
            href: "company",
            roles: [],
            element: CompanyList,
            subItems: [],
          },
        ],
      },
    ],
  },
  {
    // TPO — top-level expandable in sidebar (chevron + dropdown).
    // href "" means renderRoutes builds no meaningful route for the parent.
    // Sidebar sees subItems.length > 0 so it renders as a collapsible group.
    name: "TPO",
    href: "",
    element: Outlet,
    roles: [],
    subItems: [
      {
        // Company Approval — leaf route.
        // href "/tpo/company-approval" is absolute — sidebar <Link to={href}>
        // navigates directly to this path, which is registered inside <Layout/>
        // in routes.tsx so the sidebar and header are visible.
        name: "Company Approval",
        href: "/tpo/company-approval",
        roles: [],
        element: CompanyApprovalPage,
        subItems: [],
      },
      {
        name: "Placement Drive",
        href: "/tpo/placement-drive",
        roles: [],
        element: DrivePage,
        subItems: [],
      },
    ],
  },
  {
    name: "Company Registration",
    href: "/placement/company-registration",
    element: CompanyRegistrationPage,
    roles: [],
    subItems: [],
  },

  {
    name: "Student",
    href: "",
    element: Outlet,
    roles: [],
    subItems: [
      {
        name: "Student Profile",
        href: "student/profile",
        roles: [],
        element: StudentProfileWrapper,
        subItems: [],
      },
      {
        name: "Available Drives",
        href: "drives/available",
        roles: [],
        element: AvailableDrivesPage,
        subItems: [],
      },
    ],
  },
];

export { PLACEMENTROUTE };
export default PLACEMENTROUTE;
