import OrganizationsClient from "./OrganizationsClient";

export const metadata = {
  title: "Organizations – HazardWire",
  description: "Registered organisations that handle hazard reports.",
};

export default function OrganizationsPage() {
  return <OrganizationsClient />;
}
