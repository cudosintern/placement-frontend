import React, { useEffect } from "react";
import DataTable from "../../../../components/Table/DataTable";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import notificationService from "./notificationService";
import eventTypeService from "../event-type/eventTypeService";
import { toast } from "react-toastify";

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
    toast.success("Notification Template deleted successfully!");
    const response = await notificationService.getTemplates();
    setTemplates((response as any).data || []);
  } catch (error: any) {
    console.error(error);
    toast.error(error.response?.data?.message || "Failed to delete notification template.");
  }
};
const handleFormSubmit = async (data: any) => {
  try {
    const payload = {
      ...data,
      event_type_id: data.event_type_id ? Number(data.event_type_id) : null,
    };
    if (editingTemplate) {
      await notificationService.updateTemplate(
        editingTemplate.id,
        payload
      );
      toast.success("Notification Template updated successfully!");
    } else {
      await notificationService.addTemplate(payload);
      toast.success("Notification Template added successfully!");
    }

    const response = await notificationService.getTemplates();
    setTemplates((response as any).data || []);

    setEditingTemplate(null);
    setIsModalOpen(false);
  } catch (error: any) {
    console.error(error);
    toast.error(error.response?.data?.message || "Failed to save Notification Template.");
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

  const templatesWithEventName = templates.map((template: any) => {
    const eventType = eventTypeOptions.find(
      (option: any) => option.value === String(template.event_type_id)
    );
    return {
      ...template,
      event_type_name: eventType ? eventType.label : template.event_type_id,
    };
  });

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
        rowData={templatesWithEventName}
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