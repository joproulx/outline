import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { s } from "@shared/styles";
import Button from "~/components/Button";
import Flex from "~/components/Flex";
import Input from "~/components/Input";
import { InputSelect } from "~/components/InputSelect";
import Text from "~/components/Text";
import Task from "~/models/Task";
import useStores from "~/hooks/useStores";

type Props = {
  task?: Task;
  onSave: (task: Task) => void;
  onCancel: () => void;
};

const TaskForm = ({ task, onSave, onCancel }: Props) => {
  const { t } = useTranslation();
  const { tasks } = useStores();

  const [title, setTitle] = React.useState(task?.title || "");
  const [description, setDescription] = React.useState(task?.description || "");
  const [priority, setPriority] = React.useState<
    "high" | "medium" | "low" | "none"
  >(task?.priority || "none");
  const [dueDate, setDueDate] = React.useState(
    task?.dueDate ? task.dueDate.split("T")[0] : ""
  );
  const [tags, setTags] = React.useState(task?.tags.join(", ") || "");
  const [isLoading, setIsLoading] = React.useState(false);

  const priorityOptions = [
    { label: "None", value: "none", type: "item" as const },
    { label: "Low", value: "low", type: "item" as const },
    { label: "Medium", value: "medium", type: "item" as const },
    { label: "High", value: "high", type: "item" as const },
  ];

  const handleSubmit = React.useCallback(
    async (ev: React.FormEvent) => {
      ev.preventDefault();

      if (!title.trim()) {
        return;
      }
      setIsLoading(true);
      try {
        const taskData = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        };

        let savedTask: Task;
        if (task) {
          savedTask = await tasks.update(task, taskData);
        } else {
          savedTask = await tasks.create(taskData);
        }

        onSave(savedTask);
      } catch (_error) {
        // Handle error silently for now
      } finally {
        setIsLoading(false);
      }
    },
    [title, description, priority, dueDate, tags, task, tasks, onSave]
  );

  const isValid = title.trim().length > 0;

  return (
    <Form onSubmit={handleSubmit}>
      <FormField>
        <Label>{t("Title")}</Label>
        <Input
          type="text"
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          placeholder={t("Enter task title...")}
          required
          autoFocus
        />
      </FormField>

      <FormField>
        <Label>{t("Description")}</Label>
        <StyledTextarea
          value={description}
          onChange={(ev) => setDescription(ev.target.value)}
          placeholder={t("Add a description...")}
          rows={3}
        />
      </FormField>

      <FormRow>
        <FormField flex={1}>
          <Label>{t("Priority")}</Label>
          <InputSelect
            label="priority"
            hideLabel={true}
            options={priorityOptions}
            value={priority}
            onChange={(value) =>
              setPriority(value as "high" | "medium" | "low" | "none")
            }
          />
        </FormField>

        <FormField flex={1}>
          <Label>{t("Due Date")}</Label>
          <DateInput
            type="date"
            value={dueDate}
            onChange={(ev) => setDueDate(ev.target.value)}
          />
        </FormField>
      </FormRow>

      <FormField>
        <Label>{t("Tags")}</Label>
        <Input
          type="text"
          value={tags}
          onChange={(ev) => setTags(ev.target.value)}
          placeholder={t("Enter tags separated by commas...")}
        />
      </FormField>

      <Actions>
        <Button type="button" onClick={onCancel} neutral>
          {t("Cancel")}
        </Button>
        <Button type="submit" disabled={!isValid || isLoading}>
          {isLoading
            ? t("Saving...")
            : task
              ? t("Update Task")
              : t("Create Task")}
        </Button>
      </Actions>
    </Form>
  );
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: ${s("background")};
  border: 1px solid ${s("divider")};
  border-radius: 8px;
`;

const FormField = styled.div<{ flex?: number }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: ${(props) => props.flex || 0};
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;
`;

const Label = styled(Text).attrs({ as: "label", weight: "medium" })`
  font-size: 14px;
  color: ${s("text")};
`;

const StyledTextarea = styled.textarea`
  border: 1px solid ${s("inputBorder")};
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 15px;
  color: ${s("text")};
  background: ${s("background")};
  resize: vertical;
  min-height: 80px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${s("inputBorderFocused")};
  }

  &::placeholder {
    color: ${s("placeholder")};
  }
`;

const DateInput = styled.input`
  border: 1px solid ${s("inputBorder")};
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 15px;
  color: ${s("text")};
  background: ${s("background")};
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${s("inputBorderFocused")};
  }
`;

const Actions = styled(Flex)`
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;

export default observer(TaskForm);
