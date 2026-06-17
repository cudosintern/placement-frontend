import React from "react";
import DataTable from "../../../../components/Table/DataTable";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";

import {
  Schema,
  SchemaFields,
  SchemaColumnDefs,
} from "./notificationTemplateSchema";

const NotificationTemplatePage = () => {
  const [templates] = React.useState([
    {
      id: 1,
      notification_title: "Interview Schedule",
      notification_message: "Interview scheduled on Monday",
      notification_type: "Email",
    },
    {
      id: 2,
      notification_title: "Placement Drive",
      notification_message: "TCS drive starts tomorrow",
      notification_type: "SMS",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const OpenModalHandler = () => {
    setIsModalOpen(true);
  };

  const closeModalHandler = () => {
    setIsModalOpen(false);
  };

  const handleFormSubmit = (data: any) => {
    console.log(data);
    setIsModalOpen(false);
  };

  return (
    <div>
      {isModalOpen && (
        <ModalWithForm
          title={"Notification Template"}
          isOpen={isModalOpen}
          onSubmit={handleFormSubmit}
          onClose={closeModalHandler}
          formFields={SchemaFields}
          schema={Schema}
          size={"lg"}
          columnLayout={1}
        />
      )}

      <h3 className="text-lg leading-6 font-medium pb-5">
        Notification Template Details
      </h3>

      <DataTable
        columnDefs={SchemaColumnDefs}
        rowData={templates}
        showAddButton={true}
        addButtonHandler={OpenModalHandler}
        showExportButton={false}
        headerFilter={true}
        pageSize={20}
      />
    </div>
  );
};

export default NotificationTemplatePage;