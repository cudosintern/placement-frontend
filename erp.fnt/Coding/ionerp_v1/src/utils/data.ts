export function getRoleType() {
  return ["ionems", "ionadmission", "iontransport", "main", "ionhostel", "ionplacement"];
}

export function getRoleName(): any {
  return {
    ionems: "EMS",
    ionadmission: "Admission",
    iontransport: "Transport",
    ionhostel: "Hostel",
    main: "Main",
    ionplacement: "Placement",
  };
}

export interface CardItem {
  name: string;
  url: string;
  iconName: string;
  keyname: string;
  description: string;
}

export const MainPageCards: CardItem[] = [
  {
    name: "EMS",
    url: "/",
    iconName: "ems",
    keyname: "ionems",
    description: "",
  },
  {
    name: "Admission",
    url: "/",
    iconName: "admission",
    keyname: "ionadmission",
    description: "",
  },
  {
    name: "Transport",
    url: "/",
    iconName: "transport",
    keyname: "iontransport",
    description: "",
  },
  {
    name: "Hostel",
    url: "/",
    iconName: "hostel",
    keyname: "ionhostel",
    description: "",
  },
  {
  name: "Placement",
  url: "/",
  iconName: "ems",
  keyname: "ionplacement",
  description: "",
},
];