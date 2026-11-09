import { PublisherHub } from "../pages/publisher-hub/PublisherHub";

export default function publisherRoutes() {
  const publisherRoutes = [
    {
      label: "Publisher Hub",
      path: "/publisher/publisher-hub",
      element: <PublisherHub />,
    },
  ];
  return publisherRoutes;
}
