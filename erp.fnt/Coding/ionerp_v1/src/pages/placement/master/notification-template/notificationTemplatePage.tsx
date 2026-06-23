import React, { useEffect } from "react";
import DataTable from "../../../../components/Table/DataTable";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import notificationService from "./notificationService";
import eventTypeService from "../event-type/eventTypeService";

import {
  Schema,
  SchemaFields,
  SchemaColumnDefs,
} from "./notificationTemplateSchema";

const NotificationTemplatePage = () => {
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<any>(null);
  const [eventTypeOptions, setEventTypeOptions] = React.useState<any[]>([]);

  useEffect(() => {
    const loadTemplates = async () => {
      
      const response = await notificationService.getTemplates();
      console.log("Templates Response:", response);
      setTemplates((response as any).data || []);
    };
    
    const loadEventTypes = async () => {
  try {
    const response = await eventTypeService.getEventTypes();

    setEventTypeOptions(
  ((response as any).data || []).map((item: any) => ({
    label: item.event_name,
    value: String(item.id),
  }))
);
  } catch (error) {
    console.error(error);
  }
};
    
    loadTemplates();
    loadEventTypes();
  }, []);

  

  const OpenModalHandler = () => {
    setIsModalOpen(true);
  };

  const closeModalHandler = () => {
  setEditingTemplate(null);
  setIsModalOpen(false);
};

const editTemplateHandler = (template: any) => {
  setEditingTemplate(template);
  setIsModalOpen(true);
};

const deleteTemplateHandler = async (id: number) => {
  try {
    await notificationService.deleteTemplate(id);

    const response = await notificationService.getTemplates();

    setTemplates((response as any).data || []);
  } catch (error) {
    console.error(error);
  }
};
const handleFormSubmit = async (data: any) => {
  try {
    if (editingTemplate) {
      await notificationService.updateTemplate(
        editingTemplate.id,
        data
      );
    } else {
      await notificationService.addTemplate(data);
    }

    const response = await notificationService.getTemplates();

    setTemplates((response as any).data || []);

    setEditingTemplate(null);
    setIsModalOpen(false);
  } catch (error) {
    console.error(error);
  }
};

  const columnDefsWithAction = [
  ...SchemaColumnDefs,


{
  headerName: "Edit",
  cellRenderer: (params: any) => (
    <button
      onClick={() => editTemplateHandler(params.data)}
      className="bg-green-500 text-white px-2 py-1 rounded text-xs"
    >
      Edit
    </button>
  ),
},
  {
  headerName: "Delete",
  cellRenderer: (params: any) => (
    <button
      onClick={() => deleteTemplateHandler(params.data.id)}
      className="bg-red-500 text-white px-2 py-1 rounded text-xs"
    >
      Delete
    </button>
  ),
},
];

  return (
    <div>
      {isModalOpen && (
        
        <ModalWithForm
          title={"Notification Template"}
          isOpen={isModalOpen}
          onSubmit={handleFormSubmit}
          onClose={closeModalHandler}
          formFields={SchemaFields.map((group: any) => ({
  ...group,
  fields: group.fields.map((field: any) =>
    field.name === "event_type_id"
      ? { ...field, options: eventTypeOptions }
      : field
  ),
}))}
          schema={Schema}
          size={"lg"}
          columnLayout={1}
           initialValues={{
  ...editingTemplate,
  event_type_id: String(editingTemplate?.event_type_id ?? ""),
}}
        />
      )}

      <h3 className="text-lg leading-6 font-medium pb-5">
        Notification Template Details
      </h3>

      <DataTable
        columnDefs={columnDefsWithAction}
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