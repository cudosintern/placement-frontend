import React, { useEffect } from "react";
import DataTable from "../../../../components/Table/DataTable";

import notificationLogService from "./notificationLogService";
import { SchemaColumnDefs } from "./notificationLogSchema";

const NotificationLogPage = () => {
  const [logs, setLogs] = React.useState<any[]>([]);

  useEffect(() => {
    const loadLogs = async () => {
      const response = await notificationLogService.getNotificationLogs();
      setLogs((response as any).data || []);
    };

    loadLogs();
  }, []);

  return (
    <div>
      <h3 className="text-lg leading-6 font-medium pb-5">
        Notification Log Details
      </h3>

      <DataTable
        columnDefs={SchemaColumnDefs}
        rowData={logs}
        showAddButton={false}
        showExportButton={false}
        headerFilter={true}
        pageSize={20}
      />
    </div>
  );
};

export default NotificationLogPage;